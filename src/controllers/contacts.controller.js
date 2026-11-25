const contactsService = require("../services/contacts.service");

// Get all contacts
const getAllContacts = async (req, res) => {
  try {
    const contacts = await contactsService.getAllContacts();

    res.json({
      success: true,
      count: contacts.length,
      data: contacts,
    });
  } catch (error) {
    console.error("Database Error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch contacts",
      error: error.message,
    });
  }
};

// Get contact by ID
const getContactById = async (req, res) => {
  try {
    const contact = await contactsService.getContactById(req.params.id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    res.json({
      success: true,
      data: contact,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch contact",
    });
  }
};

module.exports = {
  getAllContacts,
  getContactById,
};
