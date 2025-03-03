const { insertDocument } = require("../../services/forms/document-services");

const createDocument = async (req, res) => {
    try {
       

        // Extract files based on their field names
        const files = {};
        const fieldNames = [
            "tenthCertificateFile",
            "academicDegreesFile",
            "selfAttestedCV",
            "endorsedCV",
            "photograph",
            "signature",
        ];

        // Map field names to URLs
        fieldNames.forEach((fieldName) => {
            const file = req.files.find((f) => f.fieldname === fieldName);
            if (file) {
                files[fieldName] = `${process.env.BASE_URL}/uploads/documents/${file.filename}`;
            } else {
                files[fieldName] = null; // Set null if not uploaded
            }
        });

        console.log("Files to be saved:", files);

        // Save to database
        const result = await insertDocument(files);

        res.status(200).json({
            success: true,
            message: "Files uploaded successfully!",
            data: result,
        });
    } catch (error) {
        console.error("Error uploading files:", error);
        res.status(500).json({
            success: false,
            message: "An error occurred while uploading the files.",
        });
    }
};

module.exports = { createDocument };
