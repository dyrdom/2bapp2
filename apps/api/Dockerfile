FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN corepack enable && pnpm install --filter @app/api... --filter @app/shared... --no-frozen-lockfile
COPY . .
RUN corepack enable && pnpm --filter @app/shared build && pnpm --filter @app/api build
EXPOSE 4000
CMD ["sh", "-c", "pnpm --filter @app/api prisma:migrate && pnpm --filter @app/api prisma:seed && pnpm --filter @app/api start"]
