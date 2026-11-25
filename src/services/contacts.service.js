const prisma = require("../config/prisma");

// Get all contacts
const getAllContacts = async () => {
  return await prisma.contact.findMany({
    orderBy: {
      id: "asc",
    },
  });
};

// Get contact by ID
const getContactById = async (id) => {
  return await prisma.contact.findUnique({
    where: {
      id: Number(id),
    },
  });
};

// Create a contact
const createContact = async (contactData) => {
  return await prisma.contact.create({
    data: contactData,
  });
};

// Update a contact
const updateContact = async (id, contactData) => {
  return await prisma.contact.update({
    where: {
      id: Number(id),
    },
    data: contactData,
  });
};

// Delete a contact
const deleteContact = async (id) => {
  return await prisma.contact.delete({
    where: {
      id: Number(id),
    },
  });
};

module.exports = {
  getAllContacts,
  getContactById,
  createContact,
  updateContact,
  deleteContact,
};
