import { PrismaClient } from "@prisma/client";

// Next.js hält Module im Dev-Modus nicht über HMR-Reloads hinweg, deshalb wird
// der Client am globalThis gecacht. Ohne das legt jeder Reload einen neuen
// Connection-Pool an, bis Postgres die Verbindungen ablehnt.
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "production" ? ["error"] : ["warn", "error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
