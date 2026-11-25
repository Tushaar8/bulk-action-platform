const express = require("express");
const app = express();

app.use(express.json());

app.use("/contacts", require("./src/routes/contacts.routes"));
app.use("/bulk-actions", require("./src/routes/bulkAction.routes"));

app.get("/", (req, res) => {
  res.json({ message: "Bulk Action Platform API is running" });
});

module.exports = app;
