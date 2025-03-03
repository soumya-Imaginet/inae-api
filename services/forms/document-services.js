const queryDB = require("../../config/queryDb");
const queries = require("../../models/db/forms/documentQueries");

const insertDocument = async (documentData) => {
    try {
        const result = await queryDB(queries.insertDocuments, [
            documentData.tenthCertificateFile,
            documentData.academicDegreesFile,
            documentData.selfAttestedCV,
            documentData.endorsedCV,
            documentData.photograph,
            documentData.signature,
        ]);
        return result;
    } catch (error) {
        throw new Error("Error saving document: " + error.message);
    }
};

module.exports = { insertDocument };
