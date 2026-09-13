/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    // ── DDD Layer Rules ──────────────────────────────────────────────
    // Domain must not depend on application, infrastructure, or interface
    {
      name: 'domain-no-upper-layers',
      severity: 'error',
      comment: 'Domain layer must be pure — no imports from application, infrastructure, or interface',
      from: { path: 'modules/[^/]+/domain/' },
      to: {
        path: 'modules/[^/]+/(application|infrastructure|interface)/',
      },
    },
    // Infrastructure must not depend on application or interface
    {
      name: 'infra-no-application-interface',
      severity: 'warn',
      comment: 'Infrastructure layer must not import from application or interface',
      from: { path: 'modules/[^/]+/infrastructure/' },
      to: {
        path: 'modules/[^/]+/(application|interface)/',
      },
    },
    // Application must not depend on infrastructure or interface (directly)
    {
      name: 'application-no-infra-interface',
      severity: 'warn',
      comment: 'Application layer must not import from infrastructure or interface directly — use ports',
      from: { path: 'modules/[^/]+/application/' },
      to: {
        path: 'modules/[^/]+/(infrastructure|interface)/',
      },
    },
    // Interface must not depend on infrastructure (directly)
    {
      name: 'interface-no-infra',
      severity: 'warn',
      comment: 'Interface layer must not import from infrastructure directly — use application or domain',
      from: { path: 'modules/[^/]+/interface/' },
      to: {
        path: 'modules/[^/]+/infrastructure/',
      },
    },

    // ── External layers must import from module barrels only ─────────
    // web/ and boot/ must import from modules/<name>/index.ts, not deep paths.
    // Module-to-module communication goes through ports/ACL adapters,
    // enforced by the DDD layer rules above.
    {
      name: 'no-module-deep-imports',
      severity: 'error',
      comment: 'Imports from web/ or boot/ must go through the module barrel (modules/<name>/index.ts), not deep paths',
      from: { path: '(web|boot)/' },
      to: {
        path: 'modules/[^/]+/',
        pathNot: 'modules/[^/]+/index(?:\\.ts|\\.js)?$',
      },
    },

    // ── No external imports to module repositories directly ───────────
    {
      name: 'no-module-repository-import',
      severity: 'error',
      comment: 'Do not import from modules/*/infrastructure/repositories — use the module barrel instead',
      from: { path: '(web|boot)/' },
      to: {
        path: 'modules/[^/]+/infrastructure/repositories/',
      },
    },

    // ── Overall project dependency direction: web → modules → libs ──
    // libs must not depend on modules or web
    {
      name: 'libs-no-modules-web',
      severity: 'warn',
      comment: 'Shared libraries (libs/) must not depend on modules or web — they are the bottom of the dependency stack',
      from: { path: 'libs/' },
      to: {
        path: '(modules|web)/',
      },
    },
    // modules must not depend on web
    {
      name: 'modules-no-web',
      severity: 'error',
      comment: 'Modules must not depend on the web layer — web depends on modules, not the other way around',
      from: { path: 'modules/' },
      to: {
        path: 'web/',
      },
    },

    // ── Circular dependencies ────────────────────────────────────────
    {
      name: 'no-circular',
      severity: 'error',
      comment: 'Circular dependencies detected',
      from: {},
      to: {
        circular: true,
      },
    },

    // ── Orphan modules ───────────────────────────────────────────────
    {
      name: 'no-orphans',
      severity: 'warn',
      comment: 'Module is not reachable from any entry point',
      from: {
        orphan: true,
        pathNot: '(__mocks__|\\.test\\.|\\.spec\\.|tests/|seeds/|migrations/|scripts/)',
      },
      to: {},
    },
  ],
  options: {
    doNotFollow: {
      path: 'node_modules',
    },
    moduleSystems: ['es6'],
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default'],
    },
    exclude: {
      path: [
        'node_modules/',
        'dist/',
        'build/',
        'coverage/',
        'public/',
        'docs/',
        'infra/',
        '\\.d\\.ts$',
        '\\.test\\.ts$',
        '\\.spec\\.ts$',
        'tests/',
        '__mocks__/',
      ],
    },
    reporterOptions: {
      dot: {
        collapsePattern: 'modules/[^/]+/[^/]+',
      },
      text: {
        highlightFocused: true,
      },
    },
  },
};
