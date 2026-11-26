const contactsService = require("../services/contacts.service");

// Get all contacts
const getAllContacts = async (req, res) => {
  try {
    const contacts = await contactsService.getAllContacts();

    return res.status(200).json({
      success: true,
      count: contacts.length,
      data: contacts,
    });
  } catch (error) {
    console.error("Database Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch contacts",
    });
  }
};

// Get contact by ID
const getContactById = async (req, res) => {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid contact ID",
      });
    }

    const contact = await contactsService.getContactById(id);

    if (!contact) {
      return res.status(404).json({
        success: false,
        message: "Contact not found",
      });
    }

    return res.status(200).json({
      success: true,
      data: contact,
    });
  } catch (error) {
    console.error("Database Error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch contact",
    });
  }
};

module.exports = {
  getAllContacts,
  getContactById,
};
