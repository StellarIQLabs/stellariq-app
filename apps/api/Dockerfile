# StellarIQ API — production image with multi-stage build, non-root user
# and env injection. Compatible with the stellariq-infra deployment.
FROM node:20-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

FROM base AS build
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/schemas/package.json packages/schemas/package.json
RUN pnpm install --frozen-lockfile
COPY apps/api apps/api
COPY packages/types packages/types
COPY packages/schemas packages/schemas
COPY tsconfig.base.json ./
# Workspace dependencies must be built before the API (pnpm -r is avoided:
# the contracts workspace needs the Rust toolchain, which is CI-only here).
RUN pnpm --filter @stellariq/types --filter @stellariq/schemas build
RUN pnpm --filter @stellariq/api build
RUN pnpm --filter @stellariq/api deploy --prod /prod/api

FROM node:20-slim AS runtime
ENV NODE_ENV=production
ENV API_PORT=4000
ENV API_HOST=0.0.0.0
RUN adduser --disabled-password --gecos '' appuser
USER appuser
WORKDIR /app
COPY --from=build /prod/api ./
EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --retries=3 CMD node -e "fetch('http://localhost:4000/health').then((r) => { if (!r.ok) process.exit(1); }).catch(() => process.exit(1))"
CMD ["node", "dist/index.js"]
