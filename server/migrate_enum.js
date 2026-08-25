import prisma from "./config/prisma.js";

async function main() {
  console.log("Checking and updating OrderStatus enum in PostgreSQL...");
  await prisma.$executeRawUnsafe(`ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'OUT_FOR_DELIVERY'`);
  console.log("✓ Added 'OUT_FOR_DELIVERY' to OrderStatus enum.");

  // Verify by creating / querying
  const enumValues = await prisma.$queryRawUnsafe(`SELECT enumlabel FROM pg_enum WHERE enumtypid = '"OrderStatus"'::regtype`);
  console.log("Current OrderStatus enum labels in DB:", enumValues);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Migration error:", err);
    process.exit(1);
  });
