require("dotenv").config();
const prisma = require("./src/config/prisma");

async function main() {
  const contacts = await prisma.contact.findMany({
    where: {
      email: { startsWith: "loadtest" },
    },
    select: { id: true },
  });

  const ids = contacts.map((contact) => contact.id);

  console.log("Contacts found:", ids.length);

  const response = await fetch("http://localhost:5000/bulk-actions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      entity: "contacts",
      action: "update",
      ids,
      data: { status: "Active" },
    }),
  });

  const result = await response.json();
  console.log("API response:", result);

  if (!response.ok) {
    throw new Error("Bulk action request failed");
  }
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
