/**
 * Prisma client singleton (spec §5, §6.3).
 *
 * Scaffolded for the production PostgreSQL path. The running demo uses a
 * client-side store (see components/store.tsx) seeded from sample data, so no
 * database or `@prisma/client` install is required to run locally. To enable:
 *
 *   1. npm i @prisma/client && npm i -D prisma
 *   2. npx prisma generate && npx prisma migrate dev
 *   3. uncomment below and swap API routes to use `prisma`.
 *
 * import { PrismaClient } from "@prisma/client";
 * const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };
 * export const prisma = globalForPrisma.prisma ?? new PrismaClient();
 * if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
 */
export {};
