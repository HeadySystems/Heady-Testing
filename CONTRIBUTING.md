# Contributing to Heady Systems

Thank you for your interest in contributing to the HeadyMonorepo.

## Getting Started

1. Clone the repository
2. Run `npm install` to install dependencies
3. Start the manager: `npm start` (runs on port 3300)

## Branch Strategy

- `main` — stable, production-ready
- `develop` — integration branch for features
- `feature/*` — individual feature branches
- `claude/*` — Claude Code agent branches

## Code Standards

- All source files must include the `HEADY_BRAND:BEGIN` / `HEADY_BRAND:END` header block
- Node.js: CommonJS `require` style
- Python: 3.x, type hints encouraged
- YAML configs live in `configs/`
- No hardcoded secrets — use environment variables

## Pipeline Stages

Changes flow through the HCFullPipeline:

```
ingest → plan → execute-major-phase → recover → finalize
```

Each stage has a checkpoint where configs, hashes, and health are validated.

## Commit Messages

Use clear, descriptive commit messages. Prefix with the area of change:

- `[pipeline]` — Pipeline engine changes
- `[packages]` — Package implementations
- `[workers]` — Cloudflare Worker changes
- `[frontend]` — UI/frontend changes
- `[configs]` — Configuration updates
- `[docs]` — Documentation updates

## Testing

- Node.js packages: Jest (`npm test`)
- Python workers: pytest
- Run health checks: `curl localhost:3300/api/health`

## Security

- Never commit secrets, API keys, or credentials
- Use timing-safe comparison for key validation
- Follow OWASP top 10 guidelines
- Report vulnerabilities privately to the maintainers
