const moment = require("moment-timezone");
const sendEmail = require("../../views/email/sendMail");
const queryDB = require("../../config/queryDb");
const queries = require("../../models/db/status/statusQueries");

const fetchStatuses = async (data) => {
  const { parentId } = data;
  try {
    const statusResult = await queryDB(queries.fetchStatusSql, [parentId]);

    return statusResult;
  } catch (error) {
    console.log(error);
    return { status: 500, message: "An internal server error occurred." };
  }
};

module.exports = { fetchStatuses };
