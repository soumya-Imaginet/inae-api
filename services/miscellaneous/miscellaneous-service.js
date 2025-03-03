const moment = require("moment-timezone");
const sendEmail = require("../../views/email/sendMail");
const queryDB = require("../../config/queryDb");
const queries = require("../../models/db/miscellaneous/miscellaneousQueries");
const otpGenerator = require("otp-generator");
const { configs } = require("../../config/commonConfig");
const { decryptPassword } = require("../../helpers/encryptPassword");
const JWT = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const UserQueries = require("../../models/db/user/userQueries");

const sendQueryToAdmin = async (data) => {
  console.log("data",data);
  const { userId, name, email, query } = data;

  try {
    const queryResult = await queryDB(queries.queryInsertSql, [
      userId,
      query,
      0,
      null,
      moment().format("YYYY-MM-DD HH:mm:ss"),
    ]);
    
    
    const fetchUserSalutation = await queryDB(UserQueries.fetchUserIdSql,[data.userId])
    console.log("fetchUserSalutation",fetchUserSalutation)
   

    if (queryResult && queryResult.affectedRows > 0) {
      const emailData = {
        userName: name,
        userEmail: email,
        salutation:fetchUserSalutation[0].salutation_name,
       
        userQuery: query,
        loginUrl: `${configs.APP_URL}/query/list`,
      };
      
      console.log("emaildata",emailData);

      // Call the function to send email here
      await sendEmail(
        process.env.QUERY_EMAIL,
        `🚨 New Query Submitted`,
        "query-to-admin-email",
        emailData
      );

      await sendEmail(
        email,
        `✅ Query Submitted Successfully`,
        "query-submit-success-email",
        emailData
      );

      console.log("mailing",email)

      return {
        success: true,
        status: 201,
        message: "Your query has been submitted successfully.",
        data: queryResult.insertId,
      };
    } else {
      return {
        success: false,
        status: 500,
        message: "Failed to insert data into the database.",
        data: [],
      };
    }
  } catch (error) {
    console.log(error);
    return {
      success: false,
      status: 500,
      message: "An internal server error occurred.",
      data: [],
    };
  }
};

const fetchQueries = async (data) => {
  console.log("filter", data);
  const { intOffset = 0, intLimit = 10, search = null, columnsorting = null, globalFilter = null } = data;
  const offset = Number(intOffset);
  const limit = Number(intLimit);

  let searchFilters = "";
  let filterValues = [];
  let sortingSql = "";

  try {
    let parsedSearch = [];
    if (typeof search === "string") {
      try {
        parsedSearch = JSON.parse(search);
      } catch (error) {
        console.error("Error parsing search JSON:", error);
      }
    }

    // ✅ Apply search filters (Column filters)
    if (Array.isArray(parsedSearch) && parsedSearch.length > 0) {
      const searchConditions = parsedSearch.map((filter) => {
        const column = filter.id === "created_at" ? "uq.created_at" : filter.id; // Prevent ambiguity
        filterValues.push(`%${filter.value}%`);
        return `${column} LIKE ?`;
      });
      if (searchConditions.length > 0) {
        searchFilters = `WHERE ${searchConditions.join(" AND ")}`;
      }
    }

    // ✅ Apply globalFilter (across multiple columns)
    if (globalFilter) {
      const globalCondition = `%${globalFilter}%`;
      const globalSearchFields = [
        "uq.query", "u.first_name", "u.middle_name", "u.last_name", "u.email",
      ];
      const globalSearchConditions = globalSearchFields.map(field => `${field} LIKE ?`).join(" OR ");
      
      if (searchFilters) {
        searchFilters += ` AND (${globalSearchConditions})`;
      } else {
        searchFilters = `WHERE (${globalSearchConditions})`;
      }
      filterValues.push(...Array(globalSearchFields.length).fill(globalCondition));
    }

    // ✅ Handle sorting
    let parsedSorting = [];
    if (typeof columnsorting === "string") {
      try {
        parsedSorting = JSON.parse(columnsorting);
      } catch (error) {
        console.error("Error parsing sorting JSON:", error);
      }
    }

    if (Array.isArray(parsedSorting) && parsedSorting.length > 0) {
      const sortingConditions = parsedSorting.map((sort) => {
        const column = sort.id === "created_at" ? "uq.created_at" : sort.id;
        return `${column} ${sort.desc ? "DESC" : "ASC"}`;
      });
      sortingSql = `ORDER BY ${sortingConditions.join(", ")}`;
    }

    // ✅ Construct main query
    const sql = `
      SELECT 
        uq.id AS query_id,
        u.first_name,
        u.middle_name,
        u.last_name,
        u.email,
        uq.query,
        uq.resolved,
        uq.resolved_at,
        uq.created_at
      FROM user_query uq
      INNER JOIN user u ON uq.userId = u.id
      ${searchFilters}
      ${sortingSql}
      LIMIT ? OFFSET ?;
    `;

    // ✅ Fetch total count (without LIMIT/OFFSET)
    const totalSql = `
      SELECT COUNT(*) as total 
      FROM user_query uq
      INNER JOIN user u ON uq.userId = u.id
      ${searchFilters};
    `;

    const totalResult = await queryDB(totalSql, filterValues);
    const totalRecords = totalResult[0]?.total || 0;
    console.log("count", totalRecords);

    // ✅ Fetch paginated result
    const result = await queryDB(sql, [...filterValues, limit, offset]);

    return {
      success: true,
      status: 200,
      message: "Queries fetched successfully.",
      data: result,
      totalCount: totalRecords,
    };
  } catch (error) {
    console.error("Error fetching queries:", error);
    return {
      success: false,
      status: 500,
      message: "An error occurred while fetching queries.",
      data: [],
      error: error.message,
    };
  }
};





const updateQueryService = async (id,  resolved) => {
  const resolvedAt = resolved ? moment().format("YYYY-MM-DD HH:mm:ss") : null;
  const updatedAt = moment().format("YYYY-MM-DD HH:mm:ss");

  try {
    const queryResult = await queryDB(
      "UPDATE user_query SET  resolved = ?, resolved_at = ?, created_at = ? WHERE id = ?",
      [resolved, resolvedAt, updatedAt, id]
    );

    if (queryResult.affectedRows > 0) {
      return {
        success: true,
        status: 200,
        message: `Query with ID ${id} updated successfully.`,
        data: queryResult,
      };
    } else {
      return {
        success: false,
        status: 404,
        message: `Query with ID ${id} not found.`,
        data: [],
      };
    }
  } catch (error) {
    console.error(error);
    return {
      success: false,
      status: 500,
      message: "An internal server error occurred.",
      data: [],
    };
  }
};










module.exports = {
  sendQueryToAdmin,fetchQueries,updateQueryService
};
