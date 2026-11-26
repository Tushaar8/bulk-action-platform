require("dotenv").config();
const prisma = require("./src/config/prisma");

async function main() {
  const batchSize = 500;
  const total = 2000;

  for (let start = 1; start <= total; start += batchSize) {
    const contacts = [];

    for (let i = start; i < start + batchSize; i++) {
      contacts.push({
        name: `Load Test ${i}`,
        email: `loadtest${i}@example.com`,
        age: 25,
        status: "Active",
      });
    }

    await prisma.contact.createMany({
      data: contacts,
      skipDuplicates: true,
    });

    console.log(`Inserted up to ${Math.min(start + batchSize - 1, total)}`);
  }

  console.log("Load-test contacts created.");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
