const express = require("express");

const router = express.Router();

const contactsController = require("../controllers/contacts.controller");

// GET /contacts
router.get("/", contactsController.getAllContacts);

// GET /contacts/:id
router.get("/:id", contactsController.getContactById);

module.exports = router;
