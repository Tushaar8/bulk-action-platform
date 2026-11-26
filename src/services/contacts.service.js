const prisma = require("../config/prisma");

// Get all contacts
const getAllContacts = () => {
  return prisma.contact.findMany({
    orderBy: {
      id: "asc",
    },
  });
};

// Get contact by ID
const getContactById = (id) => {
  return prisma.contact.findUnique({
    where: {
      id: Number(id),
    },
  });
};

// Create a contact
const createContact = (contactData) => {
  return prisma.contact.create({
    data: contactData,
  });
};

// Update a contact
const updateContact = (id, contactData) => {
  return prisma.contact.update({
    where: {
      id: Number(id),
    },
    data: contactData,
  });
};

// Delete a contact
const deleteContact = (id) => {
  return prisma.contact.delete({
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
