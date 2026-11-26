require("dotenv").config();
const prisma = require("./src/config/prisma");

async function main() {
  const contacts = await prisma.contact.findMany({
    where: {
      email: {
        startsWith: "loadtest",
      },
    },
    select: {
      id: true,
    },
    orderBy: {
      id: "asc",
    },
  });

  console.log("Total test contacts:", contacts.length);
  console.log("IDs:", contacts.map((c) => c.id).join(", "));
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
