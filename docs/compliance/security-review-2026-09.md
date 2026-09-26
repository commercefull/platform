# Security Review — Application & Infrastructure (September 2026)

**Scope**: `app.ts` and the middleware/libs it wires (`libs/auth.ts`, `libs/db/*`, `libs/correlationId.ts`, `boot/routes.ts`, `boot/graphql.ts`, identity token handling), plus all deployment targets under `infra/` (Docker, VPS/Ansible/nginx, AWS CDK, Azure Terraform, GCP Terraform).

**Method**: manual code review against OWASP Top 10 (2021) and OWASP ASVS 4.0 L2, CIS benchmarks for the respective cloud services, then runtime verification of the fixes (`NODE_ENV=production` smoke test, unit tests, `cdk` assertions, `terraform validate`, `ansible-playbook --syntax-check`, `nginx -t` on nginx 1.18).

**Status legend**: ✅ Fixed in this change · 🟡 Partially fixed / residual risk · 🔴 Open — recommendation only

---

## 1. Executive Summary

| Severity | Found | Fixed | Partial | Open |
| -------- | ----- | ----- | ------- | ---- |
| Critical | 3     | 3     | 0       | 0    |
| High     | 19    | 18    | 0       | 1    |
| Medium   | 29    | 24    | 2       | 3    |
| Low/Info | 20    | 10    | 0       | 10   |

The most severe problems were:

1. **`X-Test-Database` header honoured in every environment** — any anonymous client could redirect all SQL (including session and auth lookups) to any other database on the same server, or open unbounded connection pools (DoS). (A-01)
2. **AWS ECS set `NODE_ENV=prod`** instead of `production`, silently disabling _every_ production safeguard in the app (secure cookies, strict CSP, error redaction, CORS allow-list, GraphQL introspection off, test-DB lockout). (W-01)
3. **CloudFront cached dynamic responses** with the `CachingOptimized` policy — personalised pages and API responses could be served to other users for up to 24h, and cookies/Authorization were not forwarded. (W-02)

All three are fixed. The remaining open items are architectural (dedicated non-sudo VPS user, CSRF tokens, private networking for Azure PostgreSQL) and listed in §5 with concrete steps.

> ⚠️ **Read §6 (Deployment notes) before applying the infrastructure changes** — a few of them replace resources (notably enabling RDS storage encryption on an existing instance).

---

## 2. Application-Level Findings (`app.ts`, `libs/`, `boot/`, identity)

### A-01 · Critical · ✅ Test-database header accepted in production

- **Where**: `app.ts` test-DB middleware → `libs/db/testDbContext.ts`, `libs/db/pool.ts#getTestPool`
- **OWASP**: A01 Broken Access Control, A05 Security Misconfiguration
- **Exploit**: `curl -H 'X-Test-Database: postgres' https://shop/…` routes every query of that request (session store, login, orders) to another database reachable with the app's credentials — e.g. a staging DB with known admin passwords on the same server, allowing login to production-looking sessions. Every distinct header value also creates a new 10-connection `pg.Pool` that is never closed → memory/connection exhaustion with a trivial loop.
- **Fix**: `resolveTestDatabase()` only honours the header when `NODE_ENV` is `development` or `test` **and** the name matches `^test_[A-Za-z0-9_-]{1,56}$` (the harness naming scheme). nginx also strips the header. Unit-tested in `libs/db/testDbContext.test.ts`; verified at runtime that production ignores it.

### A-02 · High · ✅ Refresh tokens usable as access tokens

- **Where**: `modules/identity/application/useCases/token/IssueTokenPair.ts`, `libs/auth.ts`, `boot/graphql.ts`
- **OWASP**: A07 Identification & Authentication Failures (ASVS 3.5.x)
- **Exploit**: access and refresh tokens were signed with the same secret and identical claims, so the 30-day refresh token worked as a bearer token on every API. A leaked refresh token = 30 days of API access, and revoking the refresh token in the DB did not stop that.
- **Fix**: tokens now carry `tokenUse: 'access' | 'refresh'`; API/GraphQL auth (`verifyAccessJwt`) rejects `refresh`, and `RenewAccessToken` rejects `access`. Verification is pinned to `HS256` (prevents algorithm-confusion). Tests added.
- **Residual**: refresh tokens issued _before_ this deploy have no claim and remain usable until expiry. **Rotate `CUSTOMER_JWT_SECRET` / `ORGANIZATION_JWT_SECRET` when deploying** to invalidate them (forces re-login).

### A-03 · High · ✅ No brute-force / credential-stuffing protection

- **Where**: `app.ts` (no rate limiting anywhere in the app)
- **OWASP**: A07, A04 Insecure Design (ASVS 2.2.1)
- **Exploit**: unlimited password guessing on `/signin`, `/admin/login`, `/customer/identity/login|token`, `/business/auth/login|token`, password-reset endpoints (also enables reset-token brute force and email-bombing).
- **Fix**: `libs/httpSecurity.ts#createRateLimiters` (express-rate-limit 8.7.0): global 600 req/min/IP and 20 POSTs/15 min/IP on credential endpoints (`AUTH_RATE_LIMITED_PATHS`), tunable via `RATE_LIMIT_*`. Enabled everywhere except `development`/`test`. Edge limits were added in nginx, AWS WAF, Front Door WAF and Cloud Armor.
- **Residual** 🟡: the store is in-memory per process (PM2 cluster / multiple tasks multiply the budget). Use `rate-limit-redis` with the existing Redis if you need exact global limits; the edge limits are the primary control.

### A-04 · High · ✅ CDN/WAF bypass by hitting the origin directly

- **Where**: all cloud targets expose an origin URL (API Gateway `execute-api`, ALB DNS, Container App FQDN, `*.run.app`)
- **OWASP**: A05
- **Exploit**: attacker skips CloudFront/Front Door/Cloud Armor and their WAF + rate limits by calling the origin URL.
- **Fix**: `createOriginVerifyMiddleware()` rejects (403) any request without the shared secret in `ORIGIN_VERIFY_HEADER` when `ORIGIN_VERIFY_SECRET` is set (`/health` exempt). Wired in AWS (CloudFront custom header from a generated Secrets Manager secret) and Azure (`X-Azure-FDID` = Front Door profile GUID). GCP uses Cloud Run ingress restriction instead.

### A-05 · Medium · ✅ Hard-coded `trust proxy 1`

- **Where**: `app.ts` (set twice, always `1` in production)
- **OWASP**: A05
- **Exploit**: with 2 proxies (CloudFront → ALB) `req.ip` is the CDN's IP → rate limits become global (DoS) and audit logs useless; with 0 proxies clients spoof their IP via `X-Forwarded-For`.
- **Fix**: `TRUST_PROXY` hop count (default 1 in production), validated as an integer 0–10 (never `true`). Infra sets the correct value per topology.

### A-06 · Medium · ✅ CSP allowed entire public CDNs

- **Where**: `app.ts` helmet `script-src`
- **OWASP**: A03 Injection (XSS)
- **Exploit**: `https://unpkg.com`, `https://cdn.jsdelivr.net`, `https://cdnjs.cloudflare.com` serve _any_ npm/GitHub package, so any HTML-injection bug becomes script execution via `<script src="https://cdn.jsdelivr.net/npm/attacker-pkg">`, defeating CSP.
- **Fix**: in production only the exact packages used by templates are allowed (`chart.js`, `chart.js@4.4.0/`, `@tabler/core@1.4.0/`, `@tabler/core@1.0.0-beta17/`). Development keeps the permissive list.
- **Residual** 🟡: `style-src 'unsafe-inline'` remains (needed by templates); consider nonces. Better still, self-host these assets (and add SRI).

### A-07 · Medium · ✅ Internal documentation exposed in production

- **Where**: `boot/routes.ts` serves `/docs` (architecture, security guidelines, generated DB schema and full route index) and `/docs/api` (Swagger)
- **OWASP**: A05, A01 (information disclosure)
- **Fix**: only served when `NODE_ENV !== 'production'` or `DOCS_PUBLIC=true`; nginx additionally returns 404 for `/docs`.

### A-08 · Medium · ✅ Unvalidated language parameter / insecure `lang` cookie

- **Where**: `app.ts` i18next setup
- **OWASP**: A01 (path traversal), A05
- **Exploit**: `?lang=` was not restricted to known languages and is interpolated into the filesystem `loadPath`; the resulting cookie was set without `Secure`.
- **Fix**: `supportedLngs` allow-list (+ `nonExplicitSupportedLngs`), `cookieSecure` in production, `SameSite=Lax`.

### A-09 · Medium · ✅ Timing-unsafe SCIM bearer token comparison

- **Where**: `modules/identity/interface/controllers/scimController.ts`
- **OWASP**: A07
- **Fix**: constant-time `safeEqual()` (`crypto.timingSafeEqual`).

### A-10 · Low · ✅ Client-controlled correlation ID

- **Where**: `libs/correlationId.ts`
- **OWASP**: A09 Logging & Monitoring Failures (log forging)
- **Fix**: only `^[A-Za-z0-9._:-]{1,128}$` is accepted; otherwise a UUID is generated.

### A-11 · Medium · ✅ No TLS to PostgreSQL; weak production DB default

- **Where**: `libs/db/pool.ts`, `knexfile.js`
- **OWASP**: A02 Cryptographic Failures, A05
- **Exploit**: credentials and all data cross the network in cleartext to managed databases; `knexfile.js` production/staging fell back to password `postgres`.
- **Fix**: `POSTGRES_SSL`, `POSTGRES_SSL_REJECT_UNAUTHORIZED`, `POSTGRES_SSL_CA` in both the pool and Knex; production/staging fallbacks removed.

### A-12 · Low · ✅ Static assets served before security headers

- **Where**: `app.ts` — `/javascripts`, `/stylesheets`, `/images` were mounted before helmet.
- **Fix**: mounted after helmet/CORS; duplicate `trust proxy` block removed.

### A-13 · Medium · 🔴 CSRF relies only on `SameSite=Lax`

- **Where**: session-cookie protected admin (`/admin`) and storefront POST forms
- **OWASP**: A01 (ASVS 4.2.2)
- **Risk**: `Lax` blocks classic cross-site POSTs, but not attacks from sibling subdomains (e.g. a compromised `blog.example.com`) or any state-changing `GET`.
- **Recommendation**: add a double-submit / synchronizer token (`csrf-csrf`) to all EJS forms and reject missing tokens on non-GET session requests; audit routers for state-changing `GET`s; consider `SameSite=Strict` for `cf_session` (admin).

### A-14 · Medium · 🔴 HPP only protects the query string

- **Where**: `app.ts` — `hpp()` runs before the body parsers, so body parameter pollution is not normalised.
- **Recommendation**: validate body shapes per route (express-validator / zod), or move `hpp` after body parsing with a whitelist covering the admin multi-select fields.

### A-15 · Low · 🔴 Process exits on any unhandled rejection

- **Where**: `app.ts` `process.on('unhandledRejection', … process.exit(1))`
- **Risk**: any attacker-triggerable unawaited promise rejection becomes a restart/DoS lever.
- **Recommendation**: keep crashing on `uncaughtException`, but log-and-alert on `unhandledRejection`; add a lint rule (`@typescript-eslint/no-floating-promises`).

### A-16 · Low · 🔴 Access tokens are long-lived and not revocable

- **Risk**: default `JWT_EXPIRES_IN=7d`; logout / password change does not invalidate issued access tokens.
- **Recommendation**: 15-minute access tokens + refresh rotation (already supported), and a `jti` deny-list checked in `verifyAccessJwt` for logout/force-reset.

### A-17 · Low · 🔴 Same-origin user uploads

- **Where**: `public/uploads` served by `express.static`
- **Risk**: uploaded SVG/HTML is same-origin (stored XSS if content-type validation is ever bypassed). Production CSP blocks inline script and nginx now adds a `sandbox` CSP on `/public/`.
- **Recommendation**: store uploads in S3/GCS/Blob and serve from a separate cookieless domain; enforce magic-byte type checks and `Content-Disposition: attachment` for non-images.

### A-18 · Info · 🔴 4xx error details

- `errorMiddleware` returns raw messages for expected (4xx) errors, e.g. `Invalid input format: <pg message>`. Low risk, but map DB error text to generic messages.

---

## 3. Infrastructure-Level Findings

### 3.1 Docker (`infra/docker`, `.dockerignore`)

| ID   | Sev    | Status | Finding → Fix                                                                                                                                                                                                                                    |
| ---- | ------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| D-01 | High   | ✅     | PostgreSQL `5432`, Redis `6379` and the app published on **all interfaces**; hard-coded DB password; Redis `--requirepass ""` (unauthenticated → RCE via `CONFIG SET`). → Bound to `127.0.0.1`, passwords from env (`:?` required in prod), Redis always authenticated, SCRAM auth for Postgres. |
| D-02 | Medium | ✅     | `.dockerignore` excluded `.env` but not `.env.*` (e.g. `infra/docker/.env.prod`), keys, Terraform state/inventory → secrets baked into build layers/cache. → Excluded; also stopped excluding `public/` (broke the build) while excluding `public/uploads`. |
| D-03 | Medium | ✅     | `chown -R` gave the runtime user write access to all code → RCE persistence. → Only `logs/` and `uploads/` are writable; prod compose adds `read_only`, `cap_drop: ALL`, `no-new-privileges`. |
| D-04 | Medium | ✅     | `node:20-alpine` (engines require ≥22), no OS package upgrade. → `node:22-alpine` + `apk upgrade`. 🔴 Pin by digest and scan in CI (Trivy/Grype). |
| D-05 | Low    | ✅     | `yarn` as PID wrapper (signals, extra attack surface). → `node ./app.mjs` under `dumb-init`.                                                                                                                                                   |
| D-06 | Low    | ✅     | Placeholder `BASE_URL`, deploy script didn't require `.env.prod`/passwords. → Required-variable checks.                                                                                                                                         |

### 3.2 VPS (`infra/vps` — Ansible, nginx)

| ID   | Sev    | Status | Finding → Fix                                                                                                                                                                                                                         |
| ---- | ------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| V-01 | High   | ✅     | `host_key_checking = False` — MITM on an SSH session that runs everything with `become: root`. → Enabled (pre-seed `known_hosts`).                                                                                                    |
| V-02 | High   | ✅     | nginx rate limiting only on `/admin/`; login/token/reset APIs unthrottled. → `auth_limit` (5 r/m, burst 10) on credential endpoints, `global_limit` (20 r/s) elsewhere, `429` status.                                                  |
| V-03 | Medium | ✅     | nginx `add_header` inheritance bug: the HTTPS server defines HSTS, so the `http{}` security headers were **never sent**; `/public/` dropped HSTS. → Headers declared per level, app's HSTS hidden to avoid duplicates, `/public/` re-declares HSTS/nosniff plus a `sandbox` CSP for uploads. |
| V-04 | Medium | ✅     | No `default_server` → Host-header injection / direct-IP scanning. → `444` for unknown hosts on 80 and 443.                                                                                                                            |
| V-05 | Medium | ✅     | `X-Test-Database` passed through. → Stripped in every proxied location.                                                                                                                                                               |
| V-06 | Medium | ✅     | No slowloris limits. → `client_header_timeout`, `client_body_timeout`, `send_timeout`, header buffer caps; OCSP stapling.                                                                                                              |
| V-07 | Medium | ✅     | No automatic security updates or SSH ban. → `unattended-upgrades`, `fail2ban` (sshd jail), `X11Forwarding`/`AllowAgentForwarding` off.                                                                                                |
| V-08 | Medium | 🟡     | Backups (full DB dump + production `.env`) fetched unencrypted with group-readable perms. → Local backups now `0700`/owner-only. 🔴 Encrypt (`age`/`gpg`) before storage and keep an immutable offsite copy.                           |
| V-09 | High   | 🔴     | App runs as `ubuntu`, which on cloud images has **passwordless sudo** → any app RCE is root. → Create a dedicated `commercefull` system user (no sudo, no shell), set `app_user`/`app_group`, move `deploy_base`, and re-run `site.yml` + `deploy.yml`. Not changed automatically because it moves existing deployments. |
| V-10 | Low    | ✅     | Shared `.env` permissions not enforced. → `0600` enforced on every deploy.                                                                                                                                                            |
| V-11 | Low    | 🔴     | `db_password` passed with `-e` (shell history, process list). → Use `ansible-vault` / `group_vars/vault.yml` (already git-ignored).                                                                                                  |

### 3.3 AWS (`infra/aws` — CDK)

| ID   | Sev      | Status | Finding → Fix                                                                                                                                                                                                                                                                  |
| ---- | -------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| W-01 | Critical | ✅     | `NODE_ENV: environment` (`prod`) ≠ `production` → cookies not `Secure`, dev CORS origins, `unsafe-inline` CSP, stack traces in HTML errors, GraphQL introspection on, `X-Query-Count` leak, test-DB header active. → `NODE_ENV=production` always; `ENVIRONMENT` carries the stage name. |
| W-02 | Critical | ✅     | CloudFront default behaviour `CachingOptimized` for a dynamic, session-based app → cross-user cache leakage (account pages, API JSON), cookies/Authorization not forwarded. → Default behaviour `CachingDisabled` + `AllViewer` (ALB) / `AllViewerExceptHostHeader` (API GW), all methods; only `/javascripts/*`, `/stylesheets/*`, `/images/*`, `/fonts/*` cached. |
| W-03 | High     | ✅     | Single `JWT_SECRET` while the app requires `CUSTOMER_/ORGANIZATION_/ADMIN_/B2B_JWT_SECRET` (+ `COOKIE_SECRET`, `ALLOWED_ORIGINS`) — the app could not boot, and the obvious workaround (one value for all realms) lets a customer token authenticate as admin. → One generated secret per realm. |
| W-04 | High     | ✅     | Origin bypass via public `execute-api` URL / ALB DNS. → CloudFront sends `x-origin-verify` (Secrets Manager); app enforces it (A-04). 🔴 Additionally restrict the ALB SG to the CloudFront managed prefix list.                                                                   |
| W-05 | High     | ✅     | No WAF. → `AWS::WAFv2::WebACL` on CloudFront: IP reputation, Common (body-size rule in count mode for uploads), KnownBadInputs, SQLi, rate limits (100/5 min on auth paths, 3000/5 min global).                                                                                  |
| W-06 | High     | ✅     | RDS `storageEncrypted` unset (CDK default **false**), TLS not enforced, no log export. → Encrypted, `rds.force_ssl=1`, connection logging, CloudWatch export; app uses `POSTGRES_SSL=true`. **See §6 — replaces an existing unencrypted instance.**                               |
| W-07 | Medium   | ✅     | Task role had `AmazonECSTaskExecutionRolePolicy` and read access to all secrets. → Task role now only has S3 media access; secrets are injected by the execution role.                                                                                                           |
| W-08 | Medium   | ✅     | S3: no explicit Block Public Access, encryption, TLS-only policy, versioning; CORS `AllowedHeaders: *`. → `BLOCK_ALL`, SSE-S3, `enforceSSL`, versioning (prod), ACLs disabled, narrowed CORS.                                                                                      |
| W-09 | Medium   | 🟡     | ECR without scan-on-push; mutable `:latest` deployments. → Scan on push enabled. 🔴 Use immutable tags and deploy by digest.                                                                                                                                                    |
| W-10 | Medium   | ✅     | API Gateway stage without throttling. → 1000 rps / 500 burst default route settings.                                                                                                                                                                                            |
| W-11 | Low      | ✅     | ALB accepted malformed headers (desync/smuggling), default TLS policy. → `dropInvalidHeaderFields`, `RECOMMENDED_TLS`.                                                                                                                                                          |
| W-12 | Low      | ✅     | No VPC flow logs; DB SG allowed all egress. → Rejected-traffic flow logs; DB SG egress closed.                                                                                                                                                                                  |
| W-13 | Info     | ✅     | CloudFront `HttpOrigin` received the full `https://…` API URL (invalid origin). → Host extracted.                                                                                                                                                                              |
| W-14 | Low      | 🔴     | `POSTGRES_SSL_REJECT_UNAUTHORIZED=false` (RDS CA not in Node's store). → Ship the RDS CA bundle into `POSTGRES_SSL_CA` and remove the flag.                                                                                                                                      |
| W-15 | Low      | 🔴     | No rotation for generated secrets; `INTEGRATION_ENCRYPTION_KEY`, `PAYMENT_WEBHOOK_SECRET`, `SCIM_BEARER_TOKEN` not provisioned. → Add Secrets Manager entries and rotation schedules.                                                                                           |

### 3.4 Azure (`infra/azure/terraform`)

| ID   | Sev    | Status | Finding → Fix                                                                                                                                                                                                                                    |
| ---- | ------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Z-01 | High   | ✅     | Media container `container_access_type = "blob"` → anonymous read of every uploaded object (invoices, import files, …). → `private` + `allow_nested_items_to_be_public = false`. (The app's storage adapter does not use Blob today, so nothing breaks.) |
| Z-02 | High   | ✅     | Required app secrets (per-realm JWT, cookie) and `ALLOWED_ORIGINS`/`COOKIE_DOMAIN` missing. → Generated per-realm secrets injected as Container App secrets.                                                                                     |
| Z-03 | High   | ✅     | Container App ingress public → Front Door bypass; no WAF. → App enforces `X-Azure-FDID` = profile GUID; Front Door WAF policy (Prevention) with rate limits; OWASP DefaultRuleSet + Bot Manager when `frontdoor_sku = Premium_AzureFrontDoor`. |
| Z-04 | Medium | ✅     | 16-char DB password with URL-breaking specials; TLS not explicit. → 32 chars URL-safe, `require_secure_transport=on`, `ssl_min_protocol_version=TLSv1.2`, `POSTGRES_SSL=true` (full verification).                                              |
| Z-05 | Medium | ✅     | Key Vault purge protection off, 7-day soft delete. → Purge protection on, 90 days (**irreversible** once applied).                                                                                                                               |
| Z-06 | Medium | ✅     | Storage TLS/HTTPS-only implicit, no soft delete. → `TLS1_2`, HTTPS-only, 14-day blob/container soft delete.                                                                                                                                     |
| Z-07 | Low    | ✅     | Front Door HTTP requests failed instead of redirecting. → HTTP accepted and redirected to HTTPS.                                                                                                                                                 |
| Z-08 | Medium | 🔴     | PostgreSQL on a public endpoint (no VNet/private endpoint); secrets copied into Container App secrets (plaintext in Terraform state). → VNet-integrated Container Apps environment + delegated subnet/private DNS for PostgreSQL; Key Vault references via the user-assigned identity; lock down the `tfstate` storage account. |
| Z-09 | Info   | 🔴     | Pre-existing: azurerm `~> 3.0` rejects PostgreSQL version `"18"` (`terraform validate` fails). → Upgrade to azurerm 4.x (validated OK with version 16).                                                                                          |

### 3.5 GCP (`infra/gcp/terraform`)

| ID   | Sev    | Status | Finding → Fix                                                                                                                                                                                              |
| ---- | ------ | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| G-01 | High   | ✅     | `POSTGRES_PASSWORD` as a plain Cloud Run env var (readable with `run.services.get`). → All secrets via Secret Manager `secret_key_ref`.                                                                    |
| G-02 | High   | ✅     | Cloud Run ingress `all` + `allUsers` invoker → Cloud Armor/LB bypass via `*.run.app`. → `internal-and-cloud-load-balancing`.                                                                                |
| G-03 | High   | ✅     | Port 80 forwarding rule served the app over plaintext HTTP. → Dedicated redirect URL map (301 → HTTPS).                                                                                                     |
| G-04 | High   | ✅     | Service account had project-wide `secretAccessor` and `storage.objectViewer` (includes the Terraform state bucket). → Per-secret accessor bindings, bucket-scoped `objectAdmin` on the media bucket only. |
| G-05 | High   | ✅     | No Cloud Armor. → Policy with SQLi/LFI/RCE/scanner preconfigured rules, rate-based ban on auth paths, global throttle; attached to the backend.                                                              |
| G-06 | Medium | ✅     | Cloud SQL without `require_ssl` or PITR. → `require_ssl`, PITR, connection logging; app `POSTGRES_SSL=true`.                                                                                                |
| G-07 | Medium | ✅     | Bucket without public access prevention/versioning. → `enforced`, versioning on.                                                                                                                            |
| G-08 | Medium | ✅     | No SSL policy (default allows TLS 1.0). → `MODERN`, TLS 1.2+.                                                                                                                                               |
| G-09 | Medium | ✅     | Required app secrets missing. → Generated per-realm secrets in Secret Manager.                                                                                                                             |
| G-10 | Info   | ✅     | Backend referenced the Cloud Run service directly (invalid). → Serverless NEG.                                                                                                                             |
| G-11 | Low    | 🔴     | Pre-existing secret IDs (`DATABASE_URL`, `SESSION_SECRET`) have no environment suffix → collisions if dev/prod share a project. Use one project per environment or suffix them (new secrets already are). |
| G-12 | Low    | 🔴     | `POSTGRES_SSL_REJECT_UNAUTHORIZED=false` (per-instance CA). → Mount the Cloud SQL server CA into `POSTGRES_SSL_CA`, or use the Cloud SQL connector.                                                         |

---

## 4. OWASP Top 10 (2021) Coverage

| Category                                | Findings                                               |
| --------------------------------------- | ------------------------------------------------------ |
| A01 Broken Access Control               | A-01, A-07, A-08, A-13, Z-01, G-02, G-04, W-04         |
| A02 Cryptographic Failures              | A-11, W-06, W-08, Z-04, Z-06, G-03, G-06, G-08, W-14   |
| A03 Injection                           | A-06, A-14, W-05/Z-03/G-05 (WAF SQLi/XSS rules)        |
| A04 Insecure Design                     | A-03, A-15, W-02                                       |
| A05 Security Misconfiguration           | A-04, A-05, W-01, D-01, D-02, V-03, V-04, V-06, W-10   |
| A06 Vulnerable & Outdated Components    | D-04, W-09, V-07 (run `yarn sec:check` in CI)          |
| A07 Identification & Auth Failures      | A-02, A-03, A-09, A-16, W-03, Z-02, G-09               |
| A08 Software & Data Integrity Failures  | V-01, W-09 (digest pinning), A-06 (SRI recommended)    |
| A09 Security Logging & Monitoring       | A-10, W-12, G-05 (LB logging), W-06/G-06 (DB logs)     |
| A10 SSRF                                | No SSRF-capable code in scope; webhook/integration modules should restrict outbound targets (not reviewed here) |

---

## 5. Prioritised Open Recommendations

1. **V-09** — dedicated non-sudo VPS user.
2. **A-13** — CSRF tokens on all session-authenticated forms.
3. **Z-08** — private networking for Azure PostgreSQL and Key Vault references.
4. **A-16** — 15-minute access tokens + `jti` deny-list on logout/force-reset.
5. **A-17** — move uploads to object storage on a separate domain.
6. **W-14 / G-12** — verify DB server certificates with the provider CA bundle.
7. **V-08** — encrypt backups; immutable offsite copy.
8. **W-09 / D-04** — immutable image tags, digest pinning, CI image scanning.
9. Shared rate-limit store (Redis) for exact multi-instance limits (A-03 residual).
10. Secret rotation schedules and provisioning of `INTEGRATION_ENCRYPTION_KEY`, `PAYMENT_WEBHOOK_SECRET`, `SCIM_BEARER_TOKEN` in all clouds (W-15).

---

## 6. Deployment Notes (read before applying)

**Application**

- New env vars (documented in `.env.example` / `docs/generated/configuration.md`): `TRUST_PROXY`, `ORIGIN_VERIFY_SECRET`, `ORIGIN_VERIFY_HEADER`, `RATE_LIMIT_GLOBAL_PER_MINUTE`, `RATE_LIMIT_AUTH_PER_15_MINUTES`, `RATE_LIMIT_ENABLED`, `DOCS_PUBLIC`, `POSTGRES_SSL`, `POSTGRES_SSL_REJECT_UNAUTHORIZED`, `POSTGRES_SSL_CA`.
- `X-Test-Database` now only works with `NODE_ENV=development|test` — integration tests (which run against `yarn dev`) are unaffected.
- Rate limiting is off in `development`/`test`, on everywhere else (staging included).
- Rotate the customer/organization JWT secrets on deploy (A-02 residual).
- `knexfile.js` staging/production no longer default the DB password — `POSTGRES_PASSWORD` must be set.

**AWS**

- ⚠️ **`storageEncrypted: true` replaces an existing unencrypted RDS instance.** For an already-deployed stack: snapshot → copy snapshot with encryption → restore → import, _or_ temporarily keep `storageEncrypted: false` for that instance until migrated. Attaching the new parameter group requires a reboot.
- The old `commercefull/<env>/jwt-secret` is removed; new per-realm secrets are created (users must log in again).
- The WAF web ACL must live in `us-east-1` (same constraint as the CloudFront certificate); the construct skips it with a warning elsewhere.

**Azure**

- Key Vault purge protection cannot be disabled once enabled.
- The media container becomes private; serve media via SAS/Front Door if you start using Blob storage.

**GCP**

- `*.run.app` URLs stop working (by design); traffic must go through the load balancer.
- The backend service is replaced (serverless NEG) — expect a brief LB reconfiguration.

**VPS**

- Ansible now verifies host keys: `ssh-keyscan -H <host> >> ~/.ssh/known_hosts` before running.
- nginx returns `444` for unknown Host headers and `404` for `/docs`; credential endpoints are limited to 5 req/min/IP (burst 10) — tune `nginx_auth_rate_limit*` in `roles/nginx/defaults/main.yml` if needed.

---

## 7. Verification Performed

- `yarn lint` (tsc + ESLint + dependency-cruiser): 0 errors. `yarn code:lint` (knip): clean.
- `yarn test`: 699 suites / 4523 tests passing (new: `libs/httpSecurity.test.ts`, `libs/db/testDbContext.test.ts`, `modules/identity/utils/jwtHelpers.test.ts`, token-use cases in `IssueTokenPair`/`RenewAccessToken` tests).
- Production-mode smoke test: `/health` 200 without origin header; `/` 403 without / 200 with `x-origin-verify`; `/docs` 404; 4th login attempt → 429 (limit 3); malformed `X-Correlation-Id` replaced; `X-Test-Database` ignored; CSP `script-src` pinned.
- `infra/aws`: 99 CDK assertion tests passing (new security assertions for WAF, caching, TLS, S3, RDS, IAM, env).
- `terraform validate`: GCP ✅; Azure ✅ except the pre-existing PostgreSQL version constraint (Z-09).
- `ansible-playbook --syntax-check` on `site.yml`, `deploy.yml`, `backup.yml` ✅; rendered nginx config passes `nginx -t` on nginx 1.18 (Ubuntu 22.04's version).
