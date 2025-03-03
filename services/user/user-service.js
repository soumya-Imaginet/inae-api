const moment = require("moment-timezone");
const sendEmail = require("../../views/email/sendMail");
const queryDB = require("./queryDb");
const queries = require("../../models/db/user/userQueries");
const otpGenerator = require("otp-generator");
const { configs } = require("../../config/commonConfig");
const { decryptPassword } = require("../../helpers/encryptPassword");
const JWT = require("jsonwebtoken");
const bcrypt = require("bcrypt");

const convertToIST = (date) => {
  const offset = 5.5 * 60 * 60 * 1000;
  return new Date(date.getTime() + offset);
};

const createOTP = () => {
  const otp = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  });
  return otp;
};

const createNewUser = async (data) => {
  console.log("🚀💻 ~ file: user-service.js:27 ~ createNewUser ~ data:", data);

  const {
    salutation,
  salutation_name,
    otherSalutation,
    firstName,
    middleName,
    lastName,
    gender,
    email,
    phone,
    password,
    hashedPassword,
  } = data;

  const otp = createOTP();
  const otpValidTo = new Date(new Date().getTime() + 10 * 60 * 1000); // 30 minutes from now
  const formattedOtpValidTo = convertToIST(otpValidTo)
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");
  const formattedCreatedAt = convertToIST(new Date())
    .toISOString()
    .slice(0, 19)
    .replace("T", " ");

  try {
    const sql2 = `SELECT applicant_no 
    FROM user
    ORDER BY applicant_no DESC 
    LIMIT 1;`;
    const prevResult = await queryDB(sql2);

    const prev_id = prevResult[0]?.applicant_no || 0; // Default to 0 if no rows exist
    const newApplicantNo = prev_id + 1;

    if (data.userType && data.userType === 3) {
      const checkTotalCommitteeMembersSql = `SELECT COUNT(*) AS total_committee_members FROM user WHERE role = 3`;
      const totalCommitteeMembers = await queryDB(
        checkTotalCommitteeMembersSql
      );
      const totalCommitteeMembersCount =
        totalCommitteeMembers[0].total_committee_members;
      if (totalCommitteeMembersCount >= 25) {
        return {
          success: false,
          status: 400,
          message: "Committee members limit reached",
          data: [],
        };
      }
    }

    const checkDupEmail = await queryDB(queries.checkDupEmailSql, [email]);

    if (checkDupEmail && checkDupEmail[0].user_count > 0) {
      return {
        success: false,
        status: 400,
        message: "Email is already exist.",
        data: [],
      };
    }

    const employeeResult = await queryDB(queries.userInsertSql, [
      data.innerUser ? data.userType : 2, // role - user
      newApplicantNo,
      salutation,
      otherSalutation,
      firstName,
      middleName,
      lastName,
      gender,
      email,
      phone,
      hashedPassword,
      otp,
      formattedOtpValidTo,
      data.status ? data.status : 2, //status - active
      0,
      null,
      formattedCreatedAt,
    ]);

    if (employeeResult.affectedRows > 0) {
      const lastInsertedId = employeeResult.insertId;

      const emailData = {
        isNewUser: true,
        name: `${firstName} ${middleName} ${lastName}`,
        salutation: salutation_name ,
        otp: otp,
        loginUrl: `${configs.APP_URL}/auth/two-steps/${lastInsertedId}/register`,
      };

      if (data.innerUser) {
        emailData.password = password;
        emailData.innerUser = true;
      } else {
        emailData.otp = otp;
        emailData.innerUser = false;
      }

      sendEmail(
        email,
        `User Registration OTP Email`,
        "user-register-otp-email",
        emailData
      );
    } else {
      console.log("Insertion failed.");
    }

    return {
      success: true,
      status: 201,
      message: "User registered & email sent successfully",
      data: employeeResult.insertId,
    };
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

const UpdateUserById = async (req) => {

  console.log("🖥️👉🏻 ~ :155 ~ UpdateUserById ~ req.body:", req.body);
  console.log("🖥️👉🏻 ~ :155 ~ UpdateUserById ~ req.files:", req.files);

  const data = req.body;
  const file = req.files && Array.isArray(req.files) ? req.files : null;

  // const file = req.files || null;
  let profilePicture = req.body.profilePicture;
  if (file && file.length > 0 && file[0].filename) {
    profilePicture = `${configs.BASE_URL}/uploads/documents/${file[0].filename}`;
  }

  // if (file[0]?.filename) {
  //  profilePicture = `${process.env.BASE_URL}/uploads/documents/${file[0].filename}`;
  // }

  const {
    id,
    userType,
    salutation,
    otherSalutation,
    firstName,
    middleName,
    lastName,
    gender,
    email,
    phone,
    status,
  } = data;

  try {
   

    let checkEmail = queries.checkDupEmailSql;
    checkEmail += `AND id != ?`;
    const checkDupEmail = await queryDB(checkEmail, [email, id]);

    if (checkDupEmail && checkDupEmail[0].user_count > 0) {
      
      return {
        success: false,
        status: 400,
        message: "Email is already exist.",
        data: [],
      };
    }

    const result = await queryDB(queries.updateuserSql, [
      salutation,
      otherSalutation,
      firstName,
      middleName,
      lastName,
      gender,
      email,
      phone,
      userType,
      status,
      profilePicture,

      id,
    ]);

    console.log("uuuu", result);

    return {
      success: true,
      status: 201,
      message: "User updated successfully",
      data: [],
    };
  } catch (error) {
    return {
      success: false,
      status: 500,
      message: "An internal server error occurred.",
      data: [],
    };
  }
};
const fetchUserById = async (data) => {
  console.log(data);
  const id = data?._id || null;

  try {
    const result = await queryDB(queries.fetchUserIdSql, [id]);

    return {
      success: true,
      status: 201,
      message: "User data fetched successfully",
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      status: 500,
      message: error || "An internal server error occurred.",
      data: [],
    };
  }
};
const getUsersList = async (data) => {
  try {
    // Parse pagination
    const pagination = JSON.parse(data.pagination || "{}"); // Fallback to an empty object if pagination is not provided
    const pageIndex = pagination.pageIndex || 0; // Default to page 0 if not provided
    const pageSize = pagination.pageSize || 10; // Default to 10 items per page
    const offset = pageIndex * pageSize;

    let sorting = "";
    if (data.sorting && data.sorting.length > 0) {
      const sortingArray = JSON.parse(data.sorting || "[]");
      if (Array.isArray(sortingArray) && sortingArray.length > 0) {
        const sortingConditions = sortingArray.map((sort) => {
          const column = sort.id; // Column to sort by
          const direction = sort.desc ? "DESC" : "ASC"; // Sorting direction
          return `${column} ${direction}`;
        });
        sorting = `ORDER BY ${sortingConditions.join(", ")}`; // Join multiple sorting conditions with commas
      }
    }

    // Build search filters
    let searchFilters = "";
    if (data.search && data.search.length > 0) {
      const searchArray = JSON.parse(data.search || "[]");
      if (Array.isArray(searchArray)) {
        const searchConditions = searchArray.map((filter) => {
          const column = filter.id;
          const value = filter.value;

          if (["first_name"].includes(column)) {
            return `user.first_name LIKE '%${value}%' OR user.middle_name LIKE '%${value}%' OR user.last_name LIKE '%${value}%'`;
          }

          return `user.${column} LIKE '%${value}%'`;
        });

        if (searchConditions.length > 0) {
          searchFilters = `WHERE ${searchConditions.join(" AND ")}`;
        }
      }
    }

    if (data.globalSearch && data.globalSearch.trim()) {
      const globalSearch = data.globalSearch.trim();
      const globalSearchCondition = `(
        user.first_name LIKE '%${globalSearch}%' OR
        user.last_name LIKE '%${globalSearch}%' OR
        user.middle_name LIKE '%${globalSearch}%' OR
        user.email LIKE '%${globalSearch}%' OR
         user.created_at LIKE '%${globalSearch}%' OR
        user.phone LIKE '%${globalSearch}%'
      )`;

      if (searchFilters) {
        searchFilters += ` AND ${globalSearchCondition}`;
      } else {
        searchFilters = `WHERE ${globalSearchCondition}`;
      }
    }

    // Generate query with search filters and pagination
    let query = queries.fetchUsersSql; // Base query
    if (searchFilters) {
      query += ` ${searchFilters}`; // Add WHERE clause
    }

    if (sorting) {
      query += ` ${sorting}`; // Add ORDER BY clause if sorting is provided
    }
    query += ` LIMIT ${pageSize} OFFSET ${offset};`;

    const usersList = await queryDB(query);

    let countQuery = "SELECT COUNT(*) FROM user"; // Your query for total record count
    if (searchFilters) {
      countQuery += ` ${searchFilters}`; // Add WHERE clause to count query if search filters are applied
    }

    const countResult = await queryDB(countQuery);

    const totalRecordsCount = countResult[0]["COUNT(*)"];

  

    return {
      success: true,
      status: 201,
      message: "User data fetched successfully",
      data: {
        users: usersList,
        rowCount: totalRecordsCount,
      },
    };
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
const verifyOTP = async (data) => {
  const { userId, type, otp } = data;

  try {
    const verifyOtpResult = await queryDB(queries.fetchOtpSql, [userId]);

    if (verifyOtpResult.length === 0) {
      return {
        success: false,
        status: 404,
        message: "OTP not found",
        data: [],
      };
    }

    const { otp: storedOtp, otp_valid_upto } = verifyOtpResult[0];

    // Check if the OTP validity has expired by comparing the current time with the `otp_valid_upto` time
    const currentDate = new Date();
    const otpExpiryDate = new Date(otp_valid_upto);

    if (currentDate > otpExpiryDate) {
      return {
        success: false,
        status: 400,
        message: "OTP has expired. Please request a new one.",
        data: [],
      };
    }

    if (storedOtp !== otp) {
      return {
        success: false,
        status: 400,
        message: "OTP does not match. Please try again.",
        data: [],
      };
    }

    const updateUserVerifyResult = await queryDB(queries.updateUserVerifySql, [
      1,
      userId,
    ]);

    if (updateUserVerifyResult.affectedRows === 0) {
      return {
        success: false,
        status: 500,
        message: "An internal server error occurred.",
        data: [],
      };
    }

    // If OTP is valid and not expired, return success
    return {
      success: true,
      status: 200,
      message: "OTP verified successfully",
      data: verifyOtpResult[0],
    };
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

const sendOTP = async (data) => {
  const { userId, type, email } = data;

  try {
    const queryType =
      type === "forgot" ? queries.fetchUserEmailSql : queries.fetchUserIdSql;
    const value = type === "forgot" ? email : userId;

    const verifyUserResult = await queryDB(queryType, [value]);

    if (verifyUserResult.length === 0) {
      return {
        success: false,
        status: 404,
        message: "User not found",
        data: [],
      };
    }

    const user = verifyUserResult[0];
    if (user.status !== 2) {
      return {
        success: false,
        status: 400,
        message: "Your account is not active. Please try again later",
        data: [],
      };
    }
console.log("user",user);
    const otp = createOTP();
    const otpValidTo = new Date(new Date().getTime() + 10 * 60 * 1000); // 30 minutes from now

    const otpQuery =
      type === "forgot"
        ? queries.updateUserOTPEmailSql
        : queries.updateUserOTPIdSql;
    const updateUserOTPResult = await queryDB(otpQuery, [
      otp,
      otpValidTo,
      type === "forgot" ? email : userId,
    ]);

    if (updateUserOTPResult.affectedRows === 0) {
      return {
        success: false,
        status: 500,
        message: "An internal server error occurred.",
        data: [],
      };
    } else {
      const emailData = {
        isNewUser: false,
        innerUser: false,
        name: `${user.first_name} ${user.middle_name} ${user.last_name}`,
        salutation : user.salutation_name, 
        otp: otp,
        loginUrl: `${configs.APP_URL}/auth/two-steps/${user.id}/reset-password`,
      };

      sendEmail(
        user.email,
        "Forgot Password OTP",
        "user-register-otp-email",
        emailData
      );
    }

    // If OTP is valid and not expired, return success
    return {
      success: true,
      status: 200,
      message: "OTP sent successfully.",
      data: user.id,
    };
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

const userLogin = async (data) => {
  const { email: userEmail, password } = data;

  try {
    const findUserRes = await queryDB(queries.fetchUserEmailSql, [userEmail]);
    if (findUserRes.length === 0) {
      return {
        success: false,
        status: 404,
        message: "User not found",
        data: [],
      };
    }

    const user = findUserRes[0];

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      return {
        success: false,
        status: 400,
        message: "Password is incorrect",
        data: [],
      };
    }

    if (user.status !== 2) {
      return {
        success: false,
        status: 400,
        message: "Your account is inactive",
        data: [],
      };
    }

    if (user.verification !== 1) {
      return {
        success: false,
        status: 400,
        message: "Your account is not verified",
        data: [],
      };
    }

    const formattedLastLoginTime = convertToIST(new Date())
      .toISOString()
      .slice(0, 19)
      .replace("T", " ");

    const updateLastLoginTimeRes = await queryDB(queries.updateUserLoginTime, [
      formattedLastLoginTime,
      user.id,
    ]);

    if (updateLastLoginTimeRes.affectedRows === 0) {
      return {
        success: false,
        status: 500,
        message: "Server error occurred. Try to login again",
        data: [],
      };
    }

    const { id, role, email, status } = user;

    const JWT_SECRET =
      "tHe_@%_HaRdEsT_@&_SeCrEt_@&_EvEr_@&_MaDe_@&_By_@&_ImaGiNeT_@&_VeNtUrEs_@&_for_@&_INAE_@%_";

    const token = JWT.sign(
      {
        id,
        role,
        email,
        status,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    return {
      success: true,
      status: 200,
      message: "Logged in successfully",
      data: { user, token },
    };
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

const resetPassword = async (data) => {
  const { password, hashedPassword, userId } = data;

  try {
    const verifyUserResult = await queryDB(queries.fetchUserIdSql, [userId]);
    if (verifyUserResult.length === 0) {
      return {
        success: false,
        status: 404,
        message: "User not found",
        data: [],
      };
    }

    const user = verifyUserResult[0];
    console.log("user",user)

    if (user.status !== 2) {
      return {
        success: false,
        status: 400,
        message: "Your account is not active. Please try again later",
        data: [],
      };
    }

    const updateUserPassResult = await queryDB(queries.updateUserPassSql, [
      hashedPassword,
      userId,
      user.email,
    ]);
    if (updateUserPassResult.affectedRows === 0) {
      return {
        success: false,
        status: 500,
        message: "An internal server error occurred.",
        data: [],
      };
    } else {
      const emailData = {
        name: `${user.first_name} ${user.middle_name} ${user.last_name}`,
        salutation: user.salutation_name,
        password: password,
        loginUrl: `${configs.APP_URL}/auth/login`,
      };

      sendEmail(
        user.email,
        "User Reset Password",
        "user-reset-pass-email",
        emailData
      );
    }

    // If OTP is valid and not expired, return success
    return {
      success: true,
      status: 200,
      message: "Password reset successfully.",
      data: user.id,
    };
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

const getTotalCommitteeMembers = async () => {
  try {
    const checkTotalCommitteeMembersSql = `SELECT COUNT(*) AS total_committee_members FROM user WHERE role = 3`;
    const totalCommitteeMembers = await queryDB(checkTotalCommitteeMembersSql);
    const totalCommitteeMembersCount =
      totalCommitteeMembers[0].total_committee_members;
    return {
      success: true,
      status: 200,
      message: "Committee members count fetched successfully",
      data: totalCommitteeMembersCount,
    };
  } catch (error) {
    return {
      success: false,
      status: 500,
      message: "An internal server error occurred.",
      data: [],
    };
  }
};

module.exports = {
  createNewUser,
  verifyOTP,
  sendOTP,
  userLogin,
  resetPassword,
  getUsersList,
  fetchUserById,
  UpdateUserById,
  getTotalCommitteeMembers,
};
