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
    // Exception: infrastructure/acl/ adapters and compositionRoots are allowed
    // to import from other modules' application layer — this is the cross-module
    // ACL/composition pattern for bridging module boundaries.
    {
      name: 'infra-no-application-interface',
      severity: 'error',
      comment: 'Infrastructure layer must not import from application or interface (except ACL adapters and composition roots bridging modules)',
      from: {
        path: 'modules/[^/]+/infrastructure/',
        pathNot: [
          'modules/[^/]+/infrastructure/acl/',
          'modules/[^/]+/infrastructure/compositionRoot',
        ],
      },
      to: {
        path: 'modules/[^/]+/(application|interface)/',
        pathNot: [
          'modules/[^/]+/application/ports/',
        ],
      },
    },
    // Application must not depend on infrastructure or interface (directly)
    // Exception: wired.ts files are composition roots — they import concrete
    // implementations and inject them into use cases. See:
    // docs/guides/repository-dependency-injection.md
    {
      name: 'application-no-infra-interface',
      severity: 'error',
      comment: 'Application layer must not import from infrastructure or interface directly — use ports. wired.ts composition roots are exempt.',
      from: {
        path: 'modules/[^/]+/application/',
        pathNot: [
          'modules/[^/]+/application/wired\\.ts$',
          'modules/[^/]+/application/useCases/wired\\.ts$',
        ],
      },
      to: {
        path: 'modules/[^/]+/(infrastructure|interface)/',
        pathNot: [
          'modules/[^/]+/infrastructure/index(?:\\.ts|\\.js)?$',
          'modules/[^/]+/infrastructure/acl/',
          'modules/[^/]+/infrastructure/services/',
          'modules/[^/]+/infrastructure/compositionRoot',
          'modules/[^/]+/interface/controllers/',
        ],
      },
    },
    // Application (except wired.ts) must not import from infrastructure/repositories
    // Uses baseline during migration — see docs/guides/repository-dependency-injection.md
    {
      name: 'application-no-infra-repos',
      severity: 'error',
      comment: 'Application layer must not import from infrastructure/repositories — use domain/repositories interfaces. wired.ts composition roots are exempt.',
      from: {
        path: 'modules/[^/]+/application/',
        pathNot: [
          'modules/[^/]+/application/wired\\.ts$',
          'modules/[^/]+/application/useCases/wired\\.ts$',
        ],
      },
      to: {
        path: 'modules/[^/]+/infrastructure/repositories/',
      },
    },
    // Interface must not depend on infrastructure (directly)
    {
      name: 'interface-no-infra',
      severity: 'error',
      comment: 'Interface layer must not import from infrastructure directly — use application or domain',
      from: { path: 'modules/[^/]+/interface/' },
      to: {
        path: 'modules/[^/]+/infrastructure/',
      },
    },

    // ── External layers must import from module barrels only ─────────
    // web/ must import from modules/<name>/index.ts, not deep paths.
    // boot/ is the composition root and is allowed to reach into module internals.
    // Module-to-module communication goes through ports/ACL adapters,
    // enforced by the DDD layer rules above.
    {
      name: 'no-module-deep-imports',
      severity: 'error',
      comment: 'Imports from web/ must go through the module barrel (modules/<name>/index.ts), not deep paths',
      from: { path: 'web/' },
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
      from: { path: 'web/' },
      to: {
        path: 'modules/[^/]+/infrastructure/repositories/',
      },
    },

    // ── Overall project dependency direction: web → modules → libs ──
    // libs must not depend on modules or web
    {
      name: 'libs-no-modules-web',
      severity: 'error',
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
      severity: 'error',
      comment: 'Module is not reachable from any entry point',
      from: {
        orphan: true,
        pathNot: '(__mocks__|\\.test\\.|\\.spec\\.|tests/|seeds/|migrations/|scripts/|tailwind\\.config\\.|postcss\\.config\\.|knexfile\\.|jest\\.config\\.|eslint\\.config\\.|\\.dependency-cruiser\\.|pm2\\.config\\.)',
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
