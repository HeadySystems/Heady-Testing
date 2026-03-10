# Heady™ Latent OS — Changelog

© 2026 HeadySystems Inc. — Eric Haywood — 51 Provisional Patents

## v5.2.0 — Maximum Potential Build (2026-03-10)

### Added
- **API Gateway service** — Liquid routing with circuit breakers per upstream, rate limiting, CORS
- **Middleware layer** (5 files) — request-id, CORS, auth-verify, error-handler, barrel export
- **Security layer** (4 files) — input-validator (CSL-scored), CSRF protection, secret-manager, barrel export
- **Utils layer** (3 files) — AppError typed errors, config-loader with φ-defaults, retry-helper
- **Liquid Nodes** (4 files) — edge-worker complexity scoring, durable agent state machine, edge-origin router with provider racing
- **Onboarding service** — 5-stage progressive onboarding with API + Sacred Geometry UI
- **Root Docker** — Monorepo Dockerfile + docker-compose.yml for all 7 services
- **Integration tests** — 35 new tests for liquid nodes + middleware/security
- 29 new files total

### Fixed
- Eliminated all `localhost` references in production code and infrastructure
- Fixed all empty `catch {}` blocks with named error parameters
- Fixed CI/CD test URLs to use GitHub Secrets instead of localhost
- Fixed `86400` magic number in notification service (→ Fibonacci product)

### Metrics
- Files: 88 → 117 (+29)
- Tests: 49 → 84 (+35)
- φ-Compliance: 100/100

## v5.1.0 — Deep Scan Max Potential (2026-03-10)

### Added
- Colab integration (gateway, bridge, vector ops, 3 notebooks)
- Security hardening (CSP headers, rate limiter, prompt defense)
- Observability (OpenTelemetry config, metrics collector)
- Unit tests (phi-math 35, CSL engine 8, auth-session 6)
- Documentation (3 ADRs, error codes, 2 runbooks)
- Infrastructure (Consul config, Grafana dashboard)
- 5 services: auth-session, notification, analytics, scheduler, search

## v5.0.0 — Latent OS Core (2026-03-10)

### Added
- 28 core JS modules across 10 src/ directories
- shared/phi-math.js canonical foundation
- 3 YAML configs (system, sacred-geometry, domains)
- Infrastructure: docker-compose, Dockerfile, envoy, prometheus, CI/CD
- Full documentation: ARCHITECTURE, MANIFEST, PHI-COMPLIANCE-SCORECARD
