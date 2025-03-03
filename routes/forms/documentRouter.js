const express = require("express");
const fileUpload = require("../../helpers/fileUpload");
const { createDocument } = require("../../controllers/forms/documentController");

const upload = fileUpload("uploads/documents", /jpeg|jpg|png|pdf/);

const router = express.Router();

router.post( "/upload", upload.any(),createDocument);

module.exports = router;
