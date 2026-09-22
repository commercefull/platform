# Changelog

## [1.2.2](https://github.com/commercefull/platform/compare/v1.2.1...v1.2.2) (2026-09-22)


### Performance Improvements

* index-backed product search via pg_trgm + UNION rewrite ([28f35d2](https://github.com/commercefull/platform/commit/28f35d2475b9fda85b7f551319fa77ceba326ebe))

## [1.2.1](https://github.com/commercefull/platform/compare/v1.2.0...v1.2.1) (2026-09-22)


### Bug Fixes

* exempt redis backend impls from ioredis import restriction ([cd765e9](https://github.com/commercefull/platform/commit/cd765e9416c23501a0a31ae1be8c089706bfea88))

## [1.2.0](https://github.com/commercefull/platform/compare/v1.1.0...v1.2.0) (2026-09-22)


### Features

* pluggable cache and session backends (postgres/redis) ([493b6be](https://github.com/commercefull/platform/commit/493b6be67bf4877ef55d54d183bdfd36174cef68))
* pluggable cache and session backends (postgres/redis) ([ab4cf53](https://github.com/commercefull/platform/commit/ab4cf53d0fac017e9ed8bf12c0734cd3cc7fadf5))

## [1.1.0](https://github.com/commercefull/platform/compare/v1.0.1...v1.1.0) (2026-09-21)


### Features

* centralize Express behind libs/http facade ([6db2476](https://github.com/commercefull/platform/commit/6db2476b08c3156ae05c26bf67a18406c787bf0b))


### Bug Fixes

* docs header backgroung color ([d7373a3](https://github.com/commercefull/platform/commit/d7373a3b9c5a8915201ab7ddfc91c14f5f152964))

## [1.0.1](https://github.com/commercefull/platform/compare/v1.0.0...v1.0.1) (2026-09-17)


### Bug Fixes

* add topic prefix to theme, tracking, pagebuilder, audit routers ([1ffbc2d](https://github.com/commercefull/platform/commit/1ffbc2dddf4917aef9bc2bbb144f8876757a5f85))
* ban all expect([array]).toContain patterns in ESLint ([14c2150](https://github.com/commercefull/platform/commit/14c2150645242db88478d25157818609409ff3f6))
* ban expect([array].includes(x)).toBe(true) pattern in tests ([a631af1](https://github.com/commercefull/platform/commit/a631af12709d25e2048a5ec28206c0add2a2632e))
* bump CI to Node 22 for connect-redis@10 compatibility ([667d0b1](https://github.com/commercefull/platform/commit/667d0b196616cea7b3735e6cad8ebd01d1f35996))
* CI integration tests and dependency-cruiser failures ([2eea258](https://github.com/commercefull/platform/commit/2eea25890a1fe3e04842b91741106a51df18fe90))
* correct column names in low-stock-check and table name in session-cleanup ([359eedb](https://github.com/commercefull/platform/commit/359eedb01e5190ff7969170a1c40ce8b2627f1f8))
* correct schema names, UUID validation, and duplicate-key handling ([59d245a](https://github.com/commercefull/platform/commit/59d245aea9f33d4e57482f83e3e63ed1e6daf4c8))
* enforce single HTTP status assertions in integration tests ([9b3cda3](https://github.com/commercefull/platform/commit/9b3cda358905f73f78c4b8c1acccbcb19191f0e0))
* fashion seed schema mismatches ([50a32db](https://github.com/commercefull/platform/commit/50a32db3c73213d9dcc88fe71edfa969f5cdf3f3))
* remove non-existent metadata column from fashion attributes seed ([aaf13f8](https://github.com/commercefull/platform/commit/aaf13f8511d87b4892b2a7273d36e6bcfac40c0f))
* require PostgreSQL 18 across all infrastructure ([b35412d](https://github.com/commercefull/platform/commit/b35412db921507038b4f5c8d7138810167ab82cc))
* return ISO string from unixTimestamp() for PostgreSQL timestamp columns ([2491f28](https://github.com/commercefull/platform/commit/2491f28f3a7d1a841ed219e597d71bad212b9def))
* seed supportedCurrencies array literal for PostgreSQL ([37ae55f](https://github.com/commercefull/platform/commit/37ae55f71baf05071b4496b8bdeaef6ab91b1111))
