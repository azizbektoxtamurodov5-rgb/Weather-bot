# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Telegram Bot (Ob-havo Bot)

A Telegram weather bot that shows weather for all Uzbekistan provinces, with special focus on Jizzax province and Zomin district.

### Features
- Current weather for any city/province in Uzbekistan
- Special /jizzax and /zomin commands for Jizzax province
- 5-day weather forecast
- Auto-subscribe to daily weather updates (08:00 morning, 21:00 evening Tashkent time)
- Emoji weather icons 🌧️⛅☁️☀️
- Works in groups and channels with automatic daily reports

### Bot Token
- Telegram: `8607609282:AAEtdAifqTtCC3-1teOSX0LLwmBgGGQl-5Q`
- Weather API: OpenWeatherMap (key in env or hardcoded)

### Bot Files
- `artifacts/api-server/src/bot/index.ts` — Main bot logic
- `artifacts/api-server/src/bot/weather.ts` — Weather API integration
- `artifacts/api-server/src/bot/cities.ts` — City list and keyboard
- `artifacts/api-server/src/bot/scheduler.ts` — Daily auto-reports (cron)

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
