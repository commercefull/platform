/**
 * Generate route documentation by statically parsing router files with ts-morph.
 *
 * Scans all router files under modules/ for Express router method calls
 * (router.get, router.post, etc.), extracts the path, HTTP method,
 * controller function name, and any preceding JSDoc comment.
 * Mounts paths under the correct prefix by cross-referencing boot/routes.ts.
 *
 * Outputs:
 *   - docs/generated/route-index.md  — flat table of all routes
 *   - docs/modules/<name>.md         — injects endpoint tables between markers
 *
 * Usage: tsx scripts/docs/generate-route-docs.ts
 */

import { Project, SourceFile, SyntaxKind, CallExpression } from 'ts-morph';
import fs from 'fs';
import path from 'path';

const ROOT = path.resolve(__dirname, '../..');
const MODULES_DIR = path.join(ROOT, 'modules');
const ROUTES_FILE = path.join(ROOT, 'boot/routes.ts');
const OUTPUT_INDEX = path.join(ROOT, 'docs/generated/route-index.md');
const MODULES_DOC_DIR = path.join(ROOT, 'docs/modules');

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

/**
 * Parse boot/routes.ts to find which router variable is mounted under which prefix.
 */
function parseRouteMounts(): Map<string, string> {
  const mounts = new Map<string, string>();
  const content = fs.readFileSync(ROUTES_FILE, 'utf-8');

  // Match patterns like: app.use('/customer', [routerA, routerB, ...])
  // or app.use('/business', routerName)
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

      for (const name of names) {
        mounts.set(name, prefix);
      }
    } else if (singleVar) {
      mounts.set(singleVar, prefix);
    }
  }

  // Also match storefront: app.use('/', storefrontCustomerRouter)
  const storefrontRegex = /app\.use\(\s*['"`]\/['"`]\s*,\s*(\w+)\s*\)/g;
  while ((match = storefrontRegex.exec(content)) !== null) {
    mounts.set(match[1], '/');
  }

  // Match admin: app.use('/admin', adminRouter)
  const adminRegex = /app\.use\(\s*['"`]\/admin['"`]\s*,\s*(\w+)\s*\)/g;
  while ((match = adminRegex.exec(content)) !== null) {
    mounts.set(match[1], '/admin');
  }

  return mounts;
}

/**
 * Parse boot/routes.ts to build a map of import name → original export name.
 */
function parseImportAliases(): Map<string, string> {
  const aliases = new Map<string, string>();
  const content = fs.readFileSync(ROUTES_FILE, 'utf-8');

  // Match: import { someRouter as aliasRouter } from '...'
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

/**
 * Find all router files under modules/.
 */
function findRouterFiles(): string[] {
  const results: string[] = [];

  function scanDir(dir: string) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        scanDir(fullPath);
      } else if (entry.isFile() && (entry.name.endsWith('.ts') && (fullPath.includes('/routers/') || fullPath.includes('/interface/http/')))) {
        if (entry.name.toLowerCase().includes('router')) {
          results.push(fullPath);
        }
      }
    }
  }

  scanDir(MODULES_DIR);
  return results;
}

/**
 * Extract the module name from a router file path.
 * e.g. modules/coupon/interface/routers/couponRouter.ts → "coupon"
 */
function getModuleName(filePath: string): string {
  const rel = path.relative(MODULES_DIR, filePath);
  return rel.split(path.sep)[0];
}

/**
 * Get the preceding JSDoc comment for a call expression.
 */
function getPrecedingComment(sourceFile: SourceFile, callExpr: CallExpression): string {
  const parent = callExpr.getParent();
  if (!parent) return '';

  // Try to get JSDoc from the expression statement
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

  // Try to find a preceding comment by looking at the line above
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

/**
 * Extract all route definitions from a router file.
 */
function extractRoutes(sourceFile: SourceFile, filePath: string): RouteInfo[] {
  const routes: RouteInfo[] = [];
  const moduleName = getModuleName(filePath);

  // Find the export name(s) of this file
  const exportNames: string[] = [];
  for (const exportDecl of sourceFile.getExportDeclarations()) {
    for (const specifier of exportDecl.getNamedExports()) {
      exportNames.push(specifier.getName());
    }
  }
  // Check for export const
  for (const varStmt of sourceFile.getVariableStatements()) {
    if (varStmt.isExported()) {
      for (const decl of varStmt.getDeclarations()) {
        exportNames.push(decl.getName());
      }
    }
  }
  // Check for default export
  if (sourceFile.getDefaultExportSymbol()) {
    exportNames.push('default');
  }

  // Find all call expressions that match router.<method>(path, handler)
  const callExpressions = sourceFile.getDescendantsOfKind(SyntaxKind.CallExpression);

  for (const callExpr of callExpressions) {
    const expr = callExpr.getExpression();
    if (expr.getKind() !== SyntaxKind.PropertyAccessExpression) continue;

    const propAccess = expr.asKindOrThrow(SyntaxKind.PropertyAccessExpression);
    const methodName = propAccess.getName();

    if (!HTTP_METHODS.includes(methodName as typeof HTTP_METHODS[number])) continue;

    const args = callExpr.getArguments();
    if (args.length < 2) continue;

    // First arg is the path (string literal)
    const pathArg = args[0];
    if (pathArg.getKind() !== SyntaxKind.StringLiteral) continue;

    const routePath = pathArg.asKindOrThrow(SyntaxKind.StringLiteral).getLiteralValue();

    // Second arg is the controller function reference
    const handlerArg = args[1];
    let controllerFn: string;
    let controllerFile = '';

    if (handlerArg.getKind() === SyntaxKind.Identifier) {
      controllerFn = handlerArg.asKindOrThrow(SyntaxKind.Identifier).getText();
    } else if (handlerArg.getKind() === SyntaxKind.PropertyAccessExpression) {
      const pa = handlerArg.asKindOrThrow(SyntaxKind.PropertyAccessExpression);
      controllerFn = pa.getName();
    } else if (handlerArg.getKind() === SyntaxKind.CallExpression) {
      const ce = handlerArg.asKindOrThrow(SyntaxKind.CallExpression);
      const innerExpr = ce.getExpression();
      if (innerExpr.getKind() === SyntaxKind.PropertyAccessExpression) {
        const pa = innerExpr.asKindOrThrow(SyntaxKind.PropertyAccessExpression);
        controllerFn = pa.getName();
      } else {
        controllerFn = ce.getText().substring(0, 60);
      }
    } else {
      controllerFn = handlerArg.getText().substring(0, 60);
    }

    // Try to resolve the controller file
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

      // Check namespace imports
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

/**
 * Resolve mount prefixes for all routes.
 */
function resolveMountPrefixes(routes: RouteInfo[], mounts: Map<string, string>, aliases: Map<string, string>): void {
  for (const route of routes) {
    // Try to find the mount prefix by matching router export name
    const exportNames = route.routerExportName.split(', ').filter(Boolean);

    for (const exportName of exportNames) {
      // Check direct mount
      if (mounts.has(exportName)) {
        route.mountPrefix = mounts.get(exportName)!;
        break;
      }
      // Check alias
      const originalName = aliases.get(exportName);
      if (originalName && mounts.has(originalName)) {
        route.mountPrefix = mounts.get(originalName)!;
        break;
      }
    }

    // Build full path
    if (route.mountPrefix && route.mountPrefix !== '/') {
      route.fullPath = route.mountPrefix + (route.path.startsWith('/') ? route.path : '/' + route.path);
    } else if (route.mountPrefix === '/') {
      route.fullPath = route.path;
    } else {
      route.fullPath = route.path;
    }
  }
}

/**
 * Generate the flat route index markdown.
 */
function generateRouteIndex(routes: RouteInfo[]): string {
  const sorted = [...routes].sort((a, b) => a.fullPath.localeCompare(b.fullPath));

  let md = '# Route Index\n\n';
  md += '> Auto-generated from router source files. Do not edit manually.\n';
  md += '> Run `yarn docs:routes` to regenerate.\n\n';
  md += `**Total routes:** ${routes.length}\n\n`;

  // Group by mount prefix
  const prefixes = new Map<string, RouteInfo[]>();
  for (const r of sorted) {
    const prefix = r.mountPrefix || '(unmounted)';
    if (!prefixes.has(prefix)) prefixes.set(prefix, []);
    prefixes.get(prefix)!.push(r);
  }

  for (const [prefix, prefixRoutes] of prefixes) {
    md += `## ${prefix}\n\n`;
    md += '| Method | Path | Controller | Description |\n';
    md += '|---|---|---|---|\n';

    for (const r of prefixRoutes) {
      const methodBadge = `<span class="badge badge-${r.method.toLowerCase()}">${r.method}</span>`;
      md += `| ${methodBadge} | \`${r.fullPath}\` | \`${r.controllerFn}\` | ${r.description || '—'} |\n`;
    }

    md += '\n';
  }

  return md;
}

/**
 * Generate per-module endpoint tables and inject them into docs/modules/<name>.md.
 */
function injectModuleTables(routes: RouteInfo[]): void {
  const byModule = new Map<string, RouteInfo[]>();

  for (const r of routes) {
    if (!byModule.has(r.module)) byModule.set(r.module, []);
    byModule.get(r.module)!.push(r);
  }

  for (const [moduleName, moduleRoutes] of byModule) {
    const mdFile = path.join(MODULES_DOC_DIR, `${moduleName}.md`);

    if (!fs.existsSync(mdFile)) continue;

    let content = fs.readFileSync(mdFile, 'utf-8');
    const sorted = [...moduleRoutes].sort((a, b) => a.fullPath.localeCompare(b.fullPath));

    const tableLines: string[] = [];
    tableLines.push('| Method | Endpoint | Controller | Description |');
    tableLines.push('|---|---|---|---|');

    for (const r of sorted) {
      tableLines.push(`| ${r.method} | \`${r.fullPath}\` | \`${r.controllerFn}\` | ${r.description || '—'} |`);
    }

    const tableContent = tableLines.join('\n');

    // Replace content between markers, or append if markers don't exist
    const startMarker = '<!-- GENERATED:ENDPOINTS:START -->';
    const endMarker = '<!-- GENERATED:ENDPOINTS:END -->';

    if (content.includes(startMarker) && content.includes(endMarker)) {
      const before = content.substring(0, content.indexOf(startMarker) + startMarker.length);
      const after = content.substring(content.indexOf(endMarker));
      content = before + '\n\n' + tableContent + '\n\n' + after;
    } else {
      content += '\n\n' + startMarker + '\n\n' + tableContent + '\n\n' + endMarker + '\n';
    }

    fs.writeFileSync(mdFile, content);
    console.log(`[docs:routes] Injected ${sorted.length} routes into ${moduleName}.md`);
  }
}

function main(): void {
  console.log('[docs:routes] Parsing boot/routes.ts for mount prefixes...');
  const mounts = parseRouteMounts();
  const aliases = parseImportAliases();

  console.log(`[docs:routes] Found ${mounts.size} router mounts`);

  console.log('[docs:routes] Scanning for router files...');
  const routerFiles = findRouterFiles();
  console.log(`[docs:routes] Found ${routerFiles.length} router files`);

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

  const mounted = allRoutes.filter(r => r.mountPrefix);
  const unmounted = allRoutes.filter(r => !r.mountPrefix);

  console.log(`[docs:routes] Extracted ${allRoutes.length} routes (${mounted.length} mounted, ${unmounted.length} unmounted)`);

  // Generate route index
  fs.mkdirSync(path.dirname(OUTPUT_INDEX), { recursive: true });
  fs.writeFileSync(OUTPUT_INDEX, generateRouteIndex(allRoutes));
  console.log(`[docs:routes] Generated ${OUTPUT_INDEX}`);

  // Inject into module docs
  injectModuleTables(allRoutes);
}

main();
