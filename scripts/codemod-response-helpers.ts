/**
 * One-off codemod: rewrite direct `res.*` response calls in modules/ + web/
 * to the libs/apiResponse transport helpers.
 *
 *   res.status(S).json(B)   -> jsonResponse(res, S, B)
 *   res.json(B)             -> jsonResponse(res, 200, B)
 *   res.status(S).send(B)   -> sendResponse(res, S, B)
 *   res.send(B)             -> sendResponse(res, 200, B)
 *   res.redirect(U)         -> redirectResponse(res, U)
 *   res.redirect(N, U)      -> redirectResponse(res, U, N)
 *   res.status(S).redirect  -> redirectResponse(res, U, S)
 *   res.render(V, D)        -> renderResponse(res, V, D)
 *   res.setHeader(N,V)/set  -> setHeader(res, N, V)
 *   res.cookie(...)         -> cookieResponse(res, ...)
 *   res.status(S) (bare)    -> setStatus(res, S)
 *
 * Run: npx tsx scripts/codemod-response-helpers.ts
 */
import { Node, Project, SyntaxKind } from 'ts-morph';
import type { CallExpression, SourceFile } from 'ts-morph';

const SEAM_FILES = new Set([
  'libs/apiResponse.ts',
  'libs/errorMiddleware.ts',
  'libs/adminRespond.ts',
  'libs/storefrontRespond.ts',
  'web/respond.ts',
]);

const project = new Project({ tsConfigFilePath: 'tsconfig.json', skipAddingFilesFromTsConfig: true });
project.addSourceFilesAtPaths(['modules/**/*.ts', 'web/**/*.ts']);

const skipped: string[] = [];
let rewritten = 0;
const usedHelpers = new Map<SourceFile, Set<string>>();

function markUsed(sf: SourceFile, helper: string) {
  let set = usedHelpers.get(sf);
  if (!set) {
    set = new Set();
    usedHelpers.set(sf, set);
  }
  set.add(helper);
}

function resMember(call: CallExpression): { name: string; obj: Node } | undefined {
  const callee = call.getExpression();
  if (!Node.isPropertyAccessExpression(callee)) {
    return undefined;
  }
  return { name: callee.getName(), obj: callee.getExpression() };
}

function isResStatusCall(node: Node): node is CallExpression {
  if (!Node.isCallExpression(node)) {
    return false;
  }
  const m = resMember(node);
  return m?.name === 'status' && Node.isIdentifier(m.obj) && m.obj.getText() === 'res';
}

function argText(call: CallExpression): string[] {
  return call.getArguments().map(a => a.getText());
}

function rewrite(call: CallExpression, sf: SourceFile): boolean {
  const m = resMember(call);
  if (!m) {
    return false;
  }
  const { name, obj } = m;

  // Chained: res.status(S).json(B) / .send(B) / .redirect(U)
  if (isResStatusCall(obj)) {
    const s = argText(obj)[0];
    const args = argText(call);
    if (name === 'json') {
      call.replaceWithText(`jsonResponse(res, ${s}${args.length ? `, ${args.join(', ')}` : ''})`);
      markUsed(sf, 'jsonResponse');
      return true;
    }
    if (name === 'send') {
      call.replaceWithText(`sendResponse(res, ${s}${args.length ? `, ${args.join(', ')}` : ''})`);
      markUsed(sf, 'sendResponse');
      return true;
    }
    if (name === 'redirect') {
      call.replaceWithText(`redirectResponse(res, ${args.join(', ')}, ${s})`);
      markUsed(sf, 'redirectResponse');
      return true;
    }
    return false;
  }

  // Direct: res.<method>(...)
  if (!Node.isIdentifier(obj) || obj.getText() !== 'res') {
    return false;
  }
  const args = argText(call);
  switch (name) {
    case 'json':
      call.replaceWithText(`jsonResponse(res, 200${args.length ? `, ${args.join(', ')}` : ''})`);
      markUsed(sf, 'jsonResponse');
      return true;
    case 'send':
      call.replaceWithText(`sendResponse(res, 200${args.length ? `, ${args.join(', ')}` : ''})`);
      markUsed(sf, 'sendResponse');
      return true;
    case 'redirect':
      if (args.length === 1) {
        call.replaceWithText(`redirectResponse(res, ${args[0]})`);
      } else if (args.length === 2) {
        call.replaceWithText(`redirectResponse(res, ${args[1]}, ${args[0]})`);
      } else {
        return false;
      }
      markUsed(sf, 'redirectResponse');
      return true;
    case 'render':
      if (args.length > 2) {
        skipped.push(`${sf.getFilePath()} — res.render with callback`);
        return false;
      }
      call.replaceWithText(`renderResponse(res, ${args.join(', ')})`);
      markUsed(sf, 'renderResponse');
      return true;
    case 'setHeader':
    case 'set':
      if (args.length !== 2) {
        skipped.push(`${sf.getFilePath()} — res.${name} unusual arity`);
        return false;
      }
      call.replaceWithText(`setHeader(res, ${args.join(', ')})`);
      markUsed(sf, 'setHeader');
      return true;
    case 'cookie':
      call.replaceWithText(`cookieResponse(res, ${args.join(', ')})`);
      markUsed(sf, 'cookieResponse');
      return true;
    case 'status': {
      // Only standalone uses — chained `res.status().json()` is handled via the outer call.
      const parent = call.getParent();
      if (Node.isPropertyAccessExpression(parent)) {
        return false;
      }
      call.replaceWithText(`setStatus(res, ${args.join(', ')})`);
      markUsed(sf, 'setStatus');
      return true;
    }
    default:
      return false;
  }
}

for (const sf of project.getSourceFiles()) {
  if ([...SEAM_FILES].some(name => sf.getFilePath().endsWith(name)) || sf.getFilePath().includes('.test.') || sf.getFilePath().includes('/tests/')) {
    continue;
  }
  // Deepest calls first so `res.status(S)` inside `res.status(S).json(B)` is
  // detached by the outer rewrite rather than double-rewritten.
  const calls = sf
    .getDescendantsOfKind(SyntaxKind.CallExpression)
    .sort((a, b) => b.getStart() - a.getStart() || b.getEnd() - a.getEnd());
  for (const call of calls) {
    if (call.wasForgotten()) {
      continue;
    }
    if (rewrite(call, sf)) {
      rewritten++;
    }
  }

  const helpers = usedHelpers.get(sf);
  if (helpers?.size) {
    const existing = sf.getImportDeclaration(d => d.getModuleSpecifierValue() === 'libs/apiResponse');
    if (existing) {
      const have = new Set(existing.getNamedImports().map(n => n.getName()));
      existing.addNamedImports([...helpers].filter(h => !have.has(h)).sort());
    } else {
      sf.insertImportDeclaration(0, { moduleSpecifier: 'libs/apiResponse', namedImports: [...helpers].sort() });
    }
  }
}

project.saveSync();
console.log(`rewritten: ${rewritten} call sites across ${usedHelpers.size} files`);
if (skipped.length) {
  console.log('skipped:', skipped.join('\n  '));
}
