import { PrismaClient } from "@prisma/client";

/**
 * Prisma client singleton (spec §5, §6.3). The client is constructed lazily and
 * only connects on first query, so importing it is safe even with no
 * DATABASE_URL — the app stays in guest/localStorage mode until a database and
 * Google credentials are configured.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
