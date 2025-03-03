const queries = {
    insertDocuments: `
    INSERT INTO documents (
        tenthCertificateFile,
        academicDegreesFile,
        selfAttestedCV,
        endorsedCV,
        photograph,
        signature
    ) VALUES (?, ?, ?, ?, ?, ?);
    `,
};

module.exports = queries;
