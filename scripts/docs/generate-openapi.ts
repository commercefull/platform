/**
 * Generate an OpenAPI 3.0 spec from router source files.
 *
 * Uses the same ts-morph route extraction as generate-route-docs.ts,
 * then enriches each path with request body schemas extracted from
 * controller-level TypeScript interfaces (e.g. CreateCouponBody).
 *
 * Outputs: docs/generated/openapi.json
 *
 * Usage: tsx scripts/docs/generate-openapi.ts
 */

import { Project, SourceFile, SyntaxKind, CallExpression, InterfaceDeclaration } from 'ts-morph';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../..');
const MODULES_DIR = path.join(ROOT, 'modules');
const ROUTES_FILE = path.join(ROOT, 'boot/routes.ts');
const OUTPUT = path.join(ROOT, 'docs/generated/openapi.json');

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'] as const;

interface RouteInfo {
  method: string;
  path: string;
  fullPath: string;
  controllerFn: string;
  controllerFile: string;
  description: string;
  module: string;
  mountPrefix: string;
  routerFile: string;
  routerExportName: string;
}

interface PropertySchema {
  type: string;
  format?: string;
  description?: string;
  items?: PropertySchema;
  properties?: Record<string, PropertySchema>;
  required?: string[];
}

// ─── Helper: parse .env.example mount prefixes ──────────────────────────────

function parseRouteMounts(): Map<string, string> {
  const mounts = new Map<string, string>();
  if (!fs.existsSync(ROUTES_FILE)) return mounts;

  const content = fs.readFileSync(ROUTES_FILE, 'utf-8');
  const appUseRegex = /app\.use\(\s*['"`]([^'"`]+)['"`]\s*,\s*(?:\[([^\]]+)\]|\s*(\w+)\s*)\)/g;
  let match: RegExpExecArray | null;

  while ((match = appUseRegex.exec(content)) !== null) {
    const prefix = match[1];
    const arrayContent = match[2];
    const singleVar = match[3];

    if (arrayContent) {
      const names = arrayContent
        .split(',')
        .map(s => s.trim().replace(/^.*\{(\w+)\}.*$/, '$1').replace(/^(\w+).*$/, '$1'))
        .filter(s => s.length > 0);
      for (const name of names) mounts.set(name, prefix);
    } else if (singleVar) {
      mounts.set(singleVar, prefix);
    }
  }

  const storefrontRegex = /app\.use\(\s*['"`]\/['"`]\s*,\s*(\w+)\s*\)/g;
  while ((match = storefrontRegex.exec(content)) !== null) {
    mounts.set(match[1], '/');
  }

  const adminRegex = /app\.use\(\s*['"`]\/admin['"`]\s*,\s*(\w+)\s*\)/g;
  while ((match = adminRegex.exec(content)) !== null) {
    mounts.set(match[1], '/admin');
  }

  return mounts;
}

function parseImportAliases(): Map<string, string> {
  const aliases = new Map<string, string>();
  if (!fs.existsSync(ROUTES_FILE)) return aliases;

  const content = fs.readFileSync(ROUTES_FILE, 'utf-8');
  const importAliasRegex = /import\s*\{([^}]+)\}\s*from\s*['"`][^'"`]+['"`]/g;
  let match: RegExpExecArray | null;

  while ((match = importAliasRegex.exec(content)) !== null) {
    const imports = match[1].split(',');
    for (const imp of imports) {
      const trimmed = imp.trim();
      const aliasMatch = trimmed.match(/(\w+)\s+as\s+(\w+)/);
      if (aliasMatch) {
        aliases.set(aliasMatch[2], aliasMatch[1]);
      }
    }
  }

  return aliases;
}

// ─── Helper: find router files ──────────────────────────────────────────────

function findRouterFiles(): string[] {
  const results: string[] = [];

  function scanDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile() && entry.name.endsWith('.ts') && (fullPath.includes('/routers/') || fullPath.includes('/interface/http/'))) {
        if (entry.name.toLowerCase().includes('router')) {
          results.push(fullPath);
        }
      }
    }
  }

  scanDir(MODULES_DIR);
  return results;
}

function getModuleName(filePath: string): string {
  const rel = path.relative(MODULES_DIR, filePath);
  return rel.split(path.sep)[0];
}

function getPrecedingComment(sourceFile: SourceFile, callExpr: CallExpression): string {
  const expressionStatement = callExpr.getFirstAncestorByKind(SyntaxKind.ExpressionStatement);
  if (expressionStatement) {
    const jsDocs = expressionStatement.getJsDocs();
    if (jsDocs.length > 0) {
      const comment = jsDocs[0].getComment();
      if (typeof comment === 'string') {
        return comment.trim();
      }
      if (Array.isArray(comment)) {
        return comment.filter(c => c != null).map(c => c.getText()).join(' ').trim();
      }
    }
  }

  const startLinePos = callExpr.getStartLinePos();
  const fullText = sourceFile.getFullText();
  const linesBefore = fullText.substring(0, startLinePos).split('\n');
  const commentLines: string[] = [];

  for (let i = linesBefore.length - 2; i >= 0; i--) {
    const line = linesBefore[i].trim();
    if (line.startsWith('//')) {
      commentLines.unshift(line.replace(/^\/\/\s*/, ''));
    } else if (line.startsWith('*') || line.startsWith('/*')) {
      commentLines.unshift(line.replace(/^[\s/*]+\s*/, '').replace(/[*/]+\s*$/, ''));
    } else if (line === '' || line.startsWith('router.use') || line.startsWith('// ===')) {
      break;
    } else {
      break;
    }
  }

  return commentLines.join(' ').trim();
}

// ─── Helper: convert TS type to OpenAPI schema ──────────────────────────────

function tsTypeToSchema(typeText: string): PropertySchema {
  if (typeText === 'string') return { type: 'string' };
  if (typeText === 'number') return { type: 'number' };
  if (typeText === 'boolean') return { type: 'boolean' };
  if (typeText === 'Date') return { type: 'string', format: 'date-time' };
  if (typeText.startsWith('Array<')) {
    const inner = typeText.match(/Array<(.+)>/)?.[1] || 'string';
    return { type: 'array', items: tsTypeToSchema(inner) };
  }
  if (typeText.endsWith('[]')) {
    const inner = typeText.replace(/\[\]$/, '');
    return { type: 'array', items: tsTypeToSchema(inner) };
  }
  if (typeText.startsWith('Record<')) {
    return { type: 'object', description: `Record type: ${typeText}` };
  }
  return { type: 'string', description: typeText };
}

function interfaceToSchema(iface: InterfaceDeclaration): PropertySchema {
  const properties: Record<string, PropertySchema> = {};
  const required: string[] = [];

  for (const prop of iface.getProperties()) {
    const name = prop.getName();
    const type = prop.getType().getText(prop);
    const isOptional = prop.hasQuestionToken();

    properties[name] = tsTypeToSchema(type);

    if (!isOptional) {
      required.push(name);
    }
  }

  return {
    type: 'object',
    properties,
    required: required.length > 0 ? required : undefined,
  };
}

// ─── Helper: find body interfaces in controller files ───────────────────────

function findBodyInterfaces(controllerDir: string): Map<string, PropertySchema> {
  const schemas = new Map<string, PropertySchema>();
  const controllersDir = path.join(controllerDir, 'controllers');

  if (!fs.existsSync(controllersDir)) return schemas;

  const project = new Project({ skipAddingFilesFromTsConfig: true });

  for (const file of fs.readdirSync(controllersDir)) {
    if (!file.endsWith('.ts')) continue;

    const sourceFile = project.addSourceFileAtPath(path.join(controllersDir, file));
    const interfaces = sourceFile.getInterfaces();

    for (const iface of interfaces) {
      const name = iface.getName();
      if (name && (name.includes('Body') || name.includes('Request') || name.includes('Payload'))) {
        schemas.set(name, interfaceToSchema(iface));
      }
    }
  }

  return schemas;
}

// ─── Main extraction ────────────────────────────────────────────────────────

function extractRoutes(sourceFile: SourceFile, filePath: string): RouteInfo[] {
  const routes: RouteInfo[] = [];
  const moduleName = getModuleName(filePath);

  const exportNames: string[] = [];
  for (const exportDecl of sourceFile.getExportDeclarations()) {
    for (const specifier of exportDecl.getNamedExports()) {
      exportNames.push(specifier.getName());
    }
  }
  for (const varStmt of sourceFile.getVariableStatements()) {
    if (varStmt.isExported()) {
      for (const decl of varStmt.getDeclarations()) {
        exportNames.push(decl.getName());
      }
    }
  }

  const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);

  for (const callExpr of callExpressions) {
    const expr = callExpr.getExpression();
    if (expr.getKind() !== SyntaxKind.PropertyAccessExpression) continue;

    const propAccess = expr.asKindOrThrow(SyntaxKind.PropertyAccessExpression);
    const methodName = propAccess.getName();

    if (!HTTP_METHODS.includes(methodName as typeof HTTP_METHODS[number])) continue;

    const args = callExpr.getArguments();
    if (args.length < 2) continue;

    const pathArg = args[0];
    if (pathArg.getKind() !== SyntaxKind.StringLiteral) continue;

    const routePath = pathArg.asKindOrThrow(SyntaxKind.StringLiteral).getLiteralValue();

    const handlerArg = args[1];
    let controllerFn: string;
    let controllerFile = '';

    if (handlerArg.getKind() === SyntaxKind.Identifier) {
      controllerFn = handlerArg.asKindOrThrow(SyntaxKind.Identifier).getText();
    } else if (handlerArg.getKind() === SyntaxKind.PropertyAccessExpression) {
      controllerFn = handlerArg.asKindOrThrow(SyntaxKind.PropertyAccessExpression).getName();
    } else if (handlerArg.getKind() === SyntaxKind.CallExpression) {
      const ce = handlerArg.asKindOrThrow(SyntaxKind.CallExpression);
      const innerExpr = ce.getExpression();
      if (innerExpr.getKind() === SyntaxKind.PropertyAccessExpression) {
        controllerFn = innerExpr.asKindOrThrow(SyntaxKind.PropertyAccessExpression).getName();
      } else {
        controllerFn = ce.getText().substring(0, 60);
      }
    } else {
      controllerFn = handlerArg.getText().substring(0, 60);
    }

    const importDecls = sourceFile.getImportDeclarations();
    for (const importDecl of importDecls) {
      const namedImports = importDecl.getNamedImports();
      for (const ni of namedImports) {
        if (ni.getName() === controllerFn || ni.getAliasNode()?.getText() === controllerFn) {
          controllerFile = importDecl.getModuleSpecifierValue();
          break;
        }
      }
      if (controllerFile) break;

      const namespaceImport = importDecl.getNamespaceImport();
      if (namespaceImport) {
        const nsName = namespaceImport.getText();
        if (controllerFn.startsWith(nsName + '.')) {
          controllerFile = importDecl.getModuleSpecifierValue();
          break;
        }
      }
    }

    const description = getPrecedingComment(sourceFile, callExpr);

    routes.push({
      method: methodName.toUpperCase(),
      path: routePath,
      fullPath: routePath,
      controllerFn,
      controllerFile,
      description,
      module: moduleName,
      mountPrefix: '',
      routerFile: path.relative(ROOT, filePath),
      routerExportName: exportNames.join(', '),
    });
  }

  return routes;
}

function resolveMountPrefixes(routes: RouteInfo[], mounts: Map<string, string>, aliases: Map<string, string>): void {
  for (const route of routes) {
    const exportNames = route.routerExportName.split(', ').filter(Boolean);

    for (const exportName of exportNames) {
      if (mounts.has(exportName)) {
        route.mountPrefix = mounts.get(exportName)!;
        break;
      }
      const originalName = aliases.get(exportName);
      if (originalName && mounts.has(originalName)) {
        route.mountPrefix = mounts.get(originalName)!;
        break;
      }
    }

    if (route.mountPrefix && route.mountPrefix !== '/') {
      route.fullPath = route.mountPrefix + (route.path.startsWith('/') ? route.path : '/' + route.path);
    } else if (route.mountPrefix === '/') {
      route.fullPath = route.path;
    } else {
      route.fullPath = route.path;
    }
  }
}

function convertPathToOpenAPI(p: string): string {
  return p.replace(/:(\w+)/g, '{$1}');
}

function main(): void {
  console.log('[docs:openapi] Parsing boot/routes.ts...');
  const mounts = parseRouteMounts();
  const aliases = parseImportAliases();

  console.log('[docs:openapi] Scanning router files...');
  const routerFiles = findRouterFiles();
  console.log(`[docs:openapi] Found ${routerFiles.length} router files`);

  const project = new Project({
    tsConfigFilePath: path.join(ROOT, 'tsconfig.json'),
    skipAddingFilesFromTsConfig: true,
  });

  const allRoutes: RouteInfo[] = [];

  for (const routerFile of routerFiles) {
    const sourceFile = project.addSourceFileAtPath(routerFile);
    const routes = extractRoutes(sourceFile, routerFile);
    allRoutes.push(...routes);
  }

  resolveMountPrefixes(allRoutes, mounts, aliases);

  // Collect body interfaces per module
  const allSchemas: Record<string, PropertySchema> = {};

  const moduleNames = new Set(allRoutes.map(r => r.module));
  for (const moduleName of moduleNames) {
    const moduleDir = path.join(MODULES_DIR, moduleName, 'interface');
    const schemas = findBodyInterfaces(moduleDir);
    for (const [name, schema] of schemas) {
      allSchemas[name] = schema;
    }
  }

  // Build OpenAPI spec
  const paths: Record<string, Record<string, unknown>> = {};

  for (const route of allRoutes) {
    const openApiPath = convertPathToOpenAPI(route.fullPath);
    const method = route.method.toLowerCase();

    if (!paths[openApiPath]) {
      paths[openApiPath] = {};
    }

    const operation: Record<string, unknown> = {
      summary: route.description || route.controllerFn,
      operationId: `${route.controllerFn}_${route.module}`,
      tags: [route.module],
      responses: {
        '200': {
          description: 'Successful response',
        },
        '400': {
          description: 'Bad request',
        },
        '401': {
          description: 'Unauthorized',
        },
        '500': {
          description: 'Internal server error',
        },
      },
    };

    // Add request body for POST/PUT/PATCH if we can find a matching schema
    if (['POST', 'PUT', 'PATCH'].includes(route.method)) {
      // Try to find a schema that matches the controller function
      const possibleSchemaNames = Object.keys(allSchemas).filter(name =>
        name.toLowerCase().includes(route.controllerFn.toLowerCase().replace('create', '').replace('update', '').replace('apply', '').replace('validate', '').replace('redeem', '').trim()) ||
        name.toLowerCase().includes(route.module.toLowerCase())
      );

      if (possibleSchemaNames.length > 0) {
        const schemaName = possibleSchemaNames[0];
        operation.requestBody = {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: `#/components/schemas/${schemaName}`,
              },
            },
          },
        };
      }
    }

    paths[openApiPath][method] = operation;
  }

  const spec = {
    openapi: '3.0.3',
    info: {
      title: 'CommerceFull API',
      version: '1.0.0',
      description: 'Auto-generated OpenAPI specification for the CommerceFull platform REST API.',
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
    ],
    tags: Array.from(moduleNames).sort().map(name => ({ name, description: `${name} module` })),
    paths,
    components: {
      schemas: allSchemas,
    },
  };

  fs.mkdirSync(path.dirname(OUTPUT), { recursive: true });
  fs.writeFileSync(OUTPUT, JSON.stringify(spec, null, 2));

  console.log(`[docs:openapi] Generated ${OUTPUT}`);
  console.log(`[docs:openapi]   ${Object.keys(paths).length} paths`);
  console.log(`[docs:openapi]   ${Object.keys(allSchemas).length} schemas`);
}

main();
