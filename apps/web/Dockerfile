FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared/package.json packages/shared/package.json
RUN corepack enable && pnpm install --filter @app/web... --filter @app/shared... --no-frozen-lockfile
COPY . .
RUN corepack enable && pnpm --filter @app/shared build && pnpm --filter @app/web build
EXPOSE 5173
CMD ["pnpm", "--filter", "@app/web", "preview", "--host", "0.0.0.0", "--port", "5173"]
