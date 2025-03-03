const queryDB = require("../../config/queryDb"); 
const queries = require("../../models/db/forms/refereeQueries");

const insertReference = async (refereeData) => {
    const { 
        applicantName, refereeName, refereeDesignation, institutionName, 
        refereeConnection, knownYears, AcademicProfessionalBackground, 
        InclinationTowardsEngineering, OverallEngineeringContribution, 
        EthicalStandardMaintained, additionalComments 
    } = refereeData;

    const values = [
        applicantName, refereeName, refereeDesignation, institutionName, 
        refereeConnection, knownYears, AcademicProfessionalBackground, 
        InclinationTowardsEngineering, OverallEngineeringContribution, 
        EthicalStandardMaintained, additionalComments
    ];
    console.log("values",values);
    

    try {
        const result = await queryDB(queries.insertReferee, values);
        return result;
    } catch (err) {
        throw new Error('Error inserting referee data: ' + err.message);
    }
};

module.exports = { insertReference};
