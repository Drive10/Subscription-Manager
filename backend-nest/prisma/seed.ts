const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create demo user if not exists
  let demoUser = await prisma.user.findUnique({
    where: { email: "demo@example.com" },
  });

  if (!demoUser) {
    const passwordHash = await bcrypt.hash("password123", 10);
    demoUser = await prisma.user.create({
      data: {
        email: "demo@example.com",
        passwordHash,
      },
    });
    console.log("Created demo user:", demoUser.email);
  } else {
    console.log("Demo user already exists:", demoUser.email);
  }

  // Create demo subscriptions for demo user
  const existingSubs = await prisma.subscription.findMany({
    where: { userId: demoUser.id },
  });

  if (existingSubs.length === 0) {
    const subscriptions = [
      {
        userId: demoUser.id,
        name: "Netflix",
        amount: 649,
        currency: "INR",
        billingCycle: "monthly",
        nextBillingDate: new Date("2026-04-15"),
        lastBillingDate: new Date("2026-03-15"),
        category: "Entertainment",
        status: "active",
      },
      {
        userId: demoUser.id,
        name: "Spotify",
        amount: 119,
        currency: "INR",
        billingCycle: "monthly",
        nextBillingDate: new Date("2026-04-20"),
        lastBillingDate: new Date("2026-03-20"),
        category: "Entertainment",
        status: "active",
      },
      {
        userId: demoUser.id,
        name: "Amazon Prime",
        amount: 1499,
        currency: "INR",
        billingCycle: "yearly",
        nextBillingDate: new Date("2026-06-01"),
        lastBillingDate: new Date("2025-06-01"),
        category: "Shopping",
        status: "active",
      },
      {
        userId: demoUser.id,
        name: "Disney+ Hotstar",
        amount: 1499,
        currency: "INR",
        billingCycle: "yearly",
        nextBillingDate: new Date("2026-05-10"),
        lastBillingDate: new Date("2025-05-10"),
        category: "Entertainment",
        status: "active",
      },
      {
        userId: demoUser.id,
        name: "YouTube Premium",
        amount: 139,
        currency: "INR",
        billingCycle: "monthly",
        nextBillingDate: new Date("2026-04-12"),
        lastBillingDate: new Date("2026-03-12"),
        category: "Entertainment",
        status: "active",
      },
      {
        userId: demoUser.id,
        name: "Notion",
        amount: 799,
        currency: "INR",
        billingCycle: "yearly",
        nextBillingDate: new Date("2026-08-01"),
        lastBillingDate: new Date("2025-08-01"),
        category: "Productivity",
        status: "active",
      },
      {
        userId: demoUser.id,
        name: "GitHub Pro",
        amount: 467,
        currency: "INR",
        billingCycle: "monthly",
        nextBillingDate: new Date("2026-04-25"),
        lastBillingDate: new Date("2026-03-25"),
        category: "Development",
        status: "active",
      },
      {
        userId: demoUser.id,
        name: "Cloudflare Pro",
        amount: 2083,
        currency: "INR",
        billingCycle: "monthly",
        nextBillingDate: new Date("2026-04-30"),
        lastBillingDate: new Date("2026-03-30"),
        category: "Development",
        status: "active",
      },
    ];

    for (const sub of subscriptions) {
      await prisma.subscription.create({ data: sub });
    }
    console.log("Created demo subscriptions");
  } else {
    console.log("Demo subscriptions already exist:", existingSubs.length);
  }

  console.log("Seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });