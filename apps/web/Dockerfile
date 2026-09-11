# StellarIQ Web — production image with multi-stage build, non-root user
# and env injection. Compatible with the stellariq-infra deployment.
FROM node:20-slim AS base
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate

FROM base AS build
WORKDIR /app
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY apps/web/package.json apps/web/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/schemas/package.json packages/schemas/package.json
COPY packages/sdk/package.json packages/sdk/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN pnpm install --frozen-lockfile
COPY apps/web apps/web
COPY packages/types packages/types
COPY packages/schemas packages/schemas
COPY packages/sdk packages/sdk
COPY packages/ui packages/ui
COPY tsconfig.base.json ./
# NEXT_PUBLIC_* values are baked at build time; pass them as build args.
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_WS_URL
ARG NEXT_PUBLIC_STELLAR_NETWORK=testnet
ARG NEXT_PUBLIC_HORIZON_URL=https://horizon-testnet.stellar.org
ARG NEXT_PUBLIC_SOROBAN_RPC_URL=https://soroban-testnet.stellar.org
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_WS_URL=$NEXT_PUBLIC_WS_URL
ENV NEXT_PUBLIC_STELLAR_NETWORK=$NEXT_PUBLIC_STELLAR_NETWORK
ENV NEXT_PUBLIC_HORIZON_URL=$NEXT_PUBLIC_HORIZON_URL
ENV NEXT_PUBLIC_SOROBAN_RPC_URL=$NEXT_PUBLIC_SOROBAN_RPC_URL
ENV NEXT_TELEMETRY_DISABLED=1
# Workspace dependencies must be built before the web app (pnpm -r is avoided:
# the contracts workspace needs the Rust toolchain, which is CI-only here).
RUN pnpm --filter @stellariq/types --filter @stellariq/schemas --filter @stellariq/sdk --filter @stellariq/ui build
RUN pnpm --filter @stellariq/web build

FROM node:20-slim AS runtime
ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME=0.0.0.0
RUN adduser --disabled-password --gecos '' appuser
USER appuser
WORKDIR /app
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
EXPOSE 3000
CMD ["node", "apps/web/server.js"]
