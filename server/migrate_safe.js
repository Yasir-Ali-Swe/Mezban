import prisma from "./config/prisma.js";

async function run() {
  await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "customerPhone" TEXT;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "resolvedByName" TEXT;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "Conversation" ADD COLUMN IF NOT EXISTS "resolvedAt" TIMESTAMP(3);`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "senderName" TEXT;`);
  await prisma.$executeRawUnsafe(`ALTER TABLE "Message" ADD COLUMN IF NOT EXISTS "isHuman" BOOLEAN NOT NULL DEFAULT false;`);
  console.log("Safe migration successful!");
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
