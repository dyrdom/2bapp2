# Dark Chat MVP (Telegram-like logic, Discord-like layout)

Монорепо с `apps/web`, `apps/api`, `packages/shared`.

## Стек
- Frontend: React + TypeScript + Vite + Tailwind
- Backend: Express + TypeScript
- Realtime: Socket.IO
- DB: PostgreSQL + Prisma
- Auth: JWT access + refresh

## Быстрый старт (локально)
```bash
pnpm install
cp .env.example .env
pnpm prisma:generate
pnpm prisma:migrate
pnpm prisma:seed
pnpm dev
```

### Docker
```bash
docker compose up --build
```

## Тестовые логины
- `alice@example.com / password123`
- `bob@example.com / password123`
- `charlie@example.com / password123`

## Полезные команды
```bash
pnpm test
pnpm lint
pnpm format:check
```

## Реализовано в MVP
- Регистрация / логин / refresh / логаут
- 1-на-1 диалоги
- Поиск пользователей
- Сообщения + edit/delete
- Реакции 👍 ❤️ 😂
- Read receipts
- Typing indicator
- Presence status
- Infinite scroll API (cursor)
- Unread badges

## Trade-offs
- Для скорости MVP часть функций сделана в упрощённом виде:
  - Message statuses `sent/delivered/read` представлены через events/read receipts без отдельного сложного state machine.
  - Infinite scroll реализован API-курcором; в UI базовый fetch без автоподгрузки при скролле.
  - JWT refresh хранится хэшом в таблице `User`, без отдельной таблицы с мульти-сессиями.
