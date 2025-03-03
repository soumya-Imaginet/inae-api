const { returnObject } = require("../../config/commonConfig");
const {
  updateDownloadStatusbyid,
  getMembershipById,
  updateMembershipData,
  addRefereeConsentData,
  getMembershipByUserId,
  getRefereeConsentStatus,
  insertColumnVisibility,
  getColumnVisibility,
  getRefereeConsentDataById,
  insertGCApprovedData,
  membershipRenewalMail,
  addCommiteeConsentData,
  upgradeMembershipByAdmin,
  getCommiteeConsentData,
  checkApplicationCount,
  updateApplicationStatus,
  triggerRenewAlertMail,
  fetchUserStatusData,
  insertPayment,
  getCommiteeCount,

  requestPermissionToUpdateApplication,
  applicationUpdatePermitService,
  decisionForApplication,
} = require("../../services/forms/membership-services");
const sendEmail = require("../../views/email/sendMail");
const { configs } = require("../../config/commonConfig");

const queryDB = require("../../config/queryDb");
const moment = require("moment");
const queries = require("../../models/db/forms/membershipQueries");
const UserQueries = require("../../models/db/user/userQueries");
const e = require("express");

const insertRefereeData = async (applicationId, referees, callback) => {
  const values = referees.map((ref, index) => [
    applicationId,
    ref.fullName,
    ref.designation,
    ref.affiliation,
    ref.address,
    ref.email,
    ref.phone,
    index + 1,
  ]);
  console.log(values);

  const sql = `
    INSERT INTO referee (applicationId, fullName, designation, affiliation, address, email, phone,refereeIndex)
    VALUES ?
  `;

  await queryDB(sql, [values]);
};

const addPayment = async (req, res) => {
  const response = await insertPayment(req.body);
};
const insertExperienceData = async (
  applicationId,
  type,
  experiences,
  callback
) => {
  if (typeof experiences === "string") {
    experiences = JSON.parse(experiences); // Ensure it's parsed into a JavaScript array
  }

  // Check if experiences is an array
  if (!Array.isArray(experiences)) {
    throw new Error("Expected experiences to be an array after parsing.");
  }

  const filteredExperiences = experiences.filter(
    (exp) =>
      exp.instituteName.trim() !== "" ||
      exp.designation.trim() !== "" ||
      exp.instituteAddress.trim() !== "" ||
      (exp.workedFrom && exp.workedFrom !== "Invalid date") ||
      (exp.workedTill && exp.workedTill !== "Invalid date")
  );

  if (filteredExperiences.length === 0) {
    console.log(
      `No valid experiences to insert for application ID: ${applicationId}`
    );
    return; // Exit early if there's no valid data
  }

  console.log("type", type);
  console.log(
    "⛔ ➡️ file: membershipController.js:101 ➡️ experiences:",
    filteredExperiences
  );

  const values = experiences.map((exp) => [
    applicationId,
    type,
    exp.instituteName,
    exp.designation,
    exp.instituteAddress,
    moment(exp.workedFrom).format("YYYY-MM-DD"),
    moment(exp.workedTill).format("YYYY-MM-DD"),
    exp.noOfYears,
    exp.currentlyWorking,
  ]);

  const sql = `
    INSERT INTO experience (applicationId, type, instituteName, designation, instituteAddress, workedFrom, workedTill, noOfYears,currentlyWorking)
    VALUES ?
  `;

  await queryDB(sql, [values]);
};

const deleteFields = (userDetails) => {
  delete userDetails.referee1fullName;
  delete userDetails.referee1Designation;
  delete userDetails.referee1Affiliation;
  delete userDetails.referee1Address;
  delete userDetails.referee1Email;
  delete userDetails.referee1Phone;

  delete userDetails.referee2fullName;
  delete userDetails.referee2Designation;
  delete userDetails.referee2Affiliation;
  delete userDetails.referee2Address;
  delete userDetails.referee2Email;
  delete userDetails.referee2Phone;

  delete userDetails.referee3fullName;
  delete userDetails.referee3Designation;
  delete userDetails.referee3Affiliation;
  delete userDetails.referee3Address;
  delete userDetails.referee3Email;
  delete userDetails.referee3Phone;

  return userDetails;
};

const fetchUserStatus = async (req, res) => {
  try {
    console.log(req.params);
    const { userId } = req.params;

    const result = await fetchUserStatusData(userId);
    return res.status(201).json({
      success: true,
      status: 201,
      message: "user status fetched successfully.",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      status: 400,
      message: "Something Went Wrong",
      data: [],
    });
  }
};


const sendMembershipRenewalMail = async (req, res) => {

  try {
    const result=await membershipRenewalMail(req.body);
    return res.status(201).json({
      success: true,

      status: 201,
      message: "Membership Renewal Mail Sent Successfully.",
      data: result,
    });
  } catch (error) {
    return res.status(400).json({
      success: false,
      status: 400,
      message: "Something Went Wrong",
      data: [],
    });
    
  }
};

const sendMailToReferees = async (referees, userDetails, applicationId) => {
  console.log("userDetails", userDetails);
  console.log("applicationId", applicationId);

  if (!Array.isArray(referees) || referees.length === 0) {
    console.log("No referees to send emails to.");
    return;
  }

  const fetchUserSalutation = await queryDB(UserQueries.fetchUserIdSql,[userDetails.created_by])
  console.log("fetch",fetchUserSalutation)
  // Prepare email data
  const emailData = {
    applicantName: `${userDetails.firstName} ${userDetails.middleName} ${userDetails.lastName}`,
    salutation:fetchUserSalutation[0].salutation_name,

    referenceFormUrl: `${configs.APP_URL}/forms/referee-consent/${applicationId}`,
  };

  // Send emails to each referee
  for (const referee of referees.slice(0, 2)) {
    const email = referee.email;
    emailData.refereeFullName = referee.fullName;
    emailData.refereeEmail = referee.email;
    emailData.referenceFormUrl = `${
      configs.APP_URL
    }/forms/referee-consent/${applicationId}?refereeEmail=${encodeURIComponent(
      referee.email
    )}&refereeIndex=${referee.index}`;

    await sendEmail(
      email,
      `Reference consent`,

      "referee-email",
      emailData
    );
    console.log("mail sent to", email);
  }
};

const applyForMembership = async (req, res) => {
  try {
    const applicationData = req.body;
    console.log(req.body);

    let {
      academia,
      research,
      industry,
      administration,
      others,
      user_id,
      ...userDetails
    } = applicationData;

    // 🔍 Check if user_id already exists in the database
    const checkUserQuery = `SELECT COUNT(*) AS count FROM membership_application WHERE user_id = ?`;
    const existingUser = await queryDB(checkUserQuery, [user_id]);

    if (existingUser[0].count > 0) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "You have already registered.",
        data: [],
      });
    }

    const fieldNames = [
      "tenthCertificateFile",
      "academicDegreesFile",
      "photograph",
      "signature",
      "employedCV",
      "GSTcertificate",
    ];

    const files = {};
    fieldNames.forEach((fieldName) => {
      const file = req.files?.find((f) => f.fieldname === fieldName);
      files[fieldName] = file
        ? `${configs.BASE_URL}/uploads/documents/${file.filename}`
        : null;
    });

    // Merge file URLs into userDetails
    userDetails = { ...userDetails, ...files };

    const referees = [
      {
        fullName: userDetails.referee1fullName,
        designation: userDetails.referee1Designation,
        affiliation: userDetails.referee1Affiliation,
        address: userDetails.referee1Address,
        email: userDetails.referee1Email,
        phone: userDetails.referee1Phone,
        index: 1,
      },
      {
        fullName: userDetails.referee2fullName,
        designation: userDetails.referee2Designation,
        affiliation: userDetails.referee2Affiliation,
        address: userDetails.referee2Address,
        email: userDetails.referee2Email,
        phone: userDetails.referee2Phone,
        index: 2,
      },
      {
        fullName: userDetails.referee3fullName,
        designation: userDetails.referee3Designation,
        affiliation: userDetails.referee3Affiliation,
        address: userDetails.referee3Address,
        email: userDetails.referee3Email,
        phone: userDetails.referee3Phone,
        index: 3,
      },
    ];

    userDetails = deleteFields(userDetails);

    userDetails.dateOfBirth = moment(userDetails.dateOfBirth).format(
      "YYYY-MM-DD"
    );
    userDetails.passYear10th = userDetails.passYear10th
      ? parseInt(moment(userDetails.passYear10th).format("YYYY"), 10)
      : null;

    userDetails.boardDegreeNameMasters =
      userDetails.boardDegreeNameMasters !== ""
        ? Number(userDetails.boardDegreeNameMasters)
        : null;

    userDetails.percentageCgpaMaster =
      userDetails.percentageCgpaMaster !== ""
        ? Number(userDetails.percentageCgpaMaster)
        : null;

    userDetails.boardDegreeNamePhd =
      userDetails.boardDegreeNamePhd !== ""
        ? Number(userDetails.boardDegreeNamePhd)
        : null;

    userDetails.percentageCgpaPhd =
      userDetails.percentageCgpaPhd !== ""
        ? Number(userDetails.percentageCgpaPhd)
        : null;
    userDetails.passYear12th = userDetails.passYear12th
      ? parseInt(moment(userDetails.passYear12th).format("YYYY"), 10)
      : null;

    userDetails.passYearBachelor = userDetails.passYearBachelor
      ? parseInt(moment(userDetails.passYearBachelor).format("YYYY"), 10)
      : null;

    userDetails.passYearMaster = userDetails.passYearMaster
      ? parseInt(moment(userDetails.passYearMaster).format("YYYY"), 10)
      : null;

    userDetails.passYearPhd = userDetails.passYearPhd
      ? parseInt(moment(userDetails.passYearPhd).format("YYYY"), 10)
      : null;

    const sql2 = `SELECT applicant_no FROM membership_application ORDER BY applicant_no DESC LIMIT 1;`;

    const prevResult = await queryDB(sql2);
    const prev_id = prevResult[0]?.applicant_no || 0;

    const newApplicantNo = prev_id + 1;

    const currentMonth = moment().month() + 1;

    // Determine the cycle based on the month
    let cycle = "";
    if (currentMonth >= 1 && currentMonth <= 3) {
      cycle = "C1";
    } else if (currentMonth >= 4 && currentMonth <= 6) {
      cycle = "C2";
    } else if (currentMonth >= 7 && currentMonth <= 9) {
      cycle = "C3";
    } else if (currentMonth >= 10 && currentMonth <= 12) {
      cycle = "C4";
    }

    const application_no = `IndM/${moment().format(
      "YYYY"
    )}/${cycle}/${newApplicantNo}`;

    const { id, endorsedCV, selfAttestedCV, ...filteredUserDetails } =
      userDetails;
    const updatedUserDetails = {
      ...filteredUserDetails,
      user_id,
      applicant_no: newApplicantNo,
      application_no,
      edit_permit: 0,
    };
    console.log("userr  details :", updatedUserDetails);

    // Insert user details
    const sql = `INSERT INTO membership_application SET ?`;
    let result;

    try {
      result = await queryDB(sql, updatedUserDetails);
    } catch (err) {
      return res.status(400).json({
        success: false,
        status: 400,
        message: "Something Went Wrong",
        data: [],
      });
    }

    const applicationId = result.insertId;

    const experienceData = [
      { type: "academia", data: academia },
      { type: "research", data: research },
      { type: "industry", data: industry },
      { type: "administration", data: administration },
      { type: "others", data: others },
    ];

    await Promise.all(
      experienceData.map(async (exp) => {
        if (exp.data && exp.data.length > 0) {
          exp.data.forEach((item) => {
            item.currentlyWorking = item.currentlyWorking === "true" ? 1 : 0;
          });

          await insertExperienceData(applicationId, exp.type, exp.data);
        }
      })
    );

    if (referees && referees.length > 0) {
      await insertRefereeData(applicationId, referees);
    }

    await sendMailToReferees(referees, userDetails, applicationId);

    return res.status(201).json({
      success: true,
      status: 201,
      message: "Membership Application Submitted Successfully.",
      data: { applicationId },
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      status: 500,
      message: "An error occurred while processing your request.",
      data: error.message ? { error: error.message } : [],
    });
  }
};
const getRefereeConsent = async (req, res) => {
  try {
    const data = await getRefereeConsentStatus();
    return res.status(201).json({
      success: true,
      status: 201,
      message: "Referee consent status fetched Successfully.",
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      status: 500,
      message: "An error occurred while processing your request.",
      data: error.message ? { error: error.message } : [],
    });
  }
};

const getCommiteeMemberCount = async (req, res) => {
  try {
    const data = await getCommiteeCount();
    return res.status(201).json({
      success: true,
      status: 201,
      message: "Referee consent status fetched Successfully.",
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      status: 500,
      message: "An error occurred while processing your request.",
      data: error.message ? { error: error.message } : [],
    });
  }
};
const getCommiteeConsent = async (req, res) => {
  try {
    const data = await getCommiteeConsentData(req.params.id);
    return res.status(201).json({
      success: true,
      status: 201,
      message: "Referee consent status fetched Successfully.",
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      status: 500,
      message: "An error occurred while processing your request.",
      data: error.message ? { error: error.message } : [],
    });
  }
};
const checkApplication = async (req, res) => {
  try {
    const data = await checkApplicationCount(req.query.userId);
    return res.status(200).json({
      success: true,
      status: 201,
      message: "Application data fetched Successfully.",
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      status: 500,
      message: "An error occurred while processing your request.",
      data: error.message ? { error: error.message } : [],
    });
  }
};

const getRefereeConsentData = async (req, res) => {
  try {
    const { id } = req.params;
    const data = await getRefereeConsentDataById(id);
    return res.status(201).json({
      success: true,
      status: 201,
      message: "Referee consent status fetched Successfully.",
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      status: 500,
      message: "An error occurred while processing your request.",
      data: error.message ? { error: error.message } : [],
    });
  }
};

const addCommiteeConsent = async (req, res) => {
  try {
    const data = await addCommiteeConsentData(req.body);
    return res.status(201).json({
      success: true,
      status: 201,
      message: data.message || "Referee consent status Added Successfully.",
      data: data,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      status: 500,
      message: "An error occurred while processing your request.",
      data: error.message ? { error: error.message } : [],
    });
  }
};
const memberShipList = async (req, res) => {
  const cycle = req.query.cycle || "";
  const selectedYear = req.query.selectedYear || "";
  const intOffset = req.query.intOffset ? parseInt(req.query.intOffset) : 10;
  const user_id = req.query.user_id || null;
  const intLimit = req.query.intLimit ? parseInt(req.query.intLimit) : 0;
  const search = req.query.search || {};
  const sorting = req.query.sorting || [];
  const globalFilter = req.query.globalFilter || "";

  let searchFilters = "";
  let filterConditions = [];
  let sql = "";

  // Build SQL query with pagination and optional filters
  let filterValues = [];

  try {
    if (req.query.toemail) {
      const id = req.query.toemail || "";

      const response = await queryDB(queries.fetchmemberById, [id]);

      if (response && response.length > 0) {
        const email = response[0].email;
        const first_name = response[0].firstname;
        const middle_name = response[0].middleName;
        const last_name = response[0].lastName; // Access the first object's email property
        console.log(email);
        const fetchDesignation = `SELECT designation,instituteName FROM experience WHERE applicationId=? AND currentlyWorking=1;
        `;
        const designation = await queryDB(fetchDesignation, [id]);


        const emailData = {
          refereeFullName: "jj",
          applicant_Name: first_name,
          last_name,
          middle_name,
          designation: designation[0].designation,
          instituteName: designation[0].instituteName,
        };

        await sendEmail(
          email,
          ` Application Status Notification`,
          "application-rejected",
          emailData
        );
        console.log("regret mail sent to", email);
      }
    }

    // Add cycle filter
    if (cycle.length > 0) {
      const cycleConditions = cycle
        .map((c) => {
          switch (c) {
            case "1":
              return "(MONTH(ma.created_at) BETWEEN 1 AND 3)";
            case "2":
              return "(MONTH(ma.created_at) BETWEEN 4 AND 6)";
            case "3":
              return "(MONTH(ma.created_at) BETWEEN 7 AND 9)";
            case "4":
              return "(MONTH(ma.created_at) BETWEEN 10 AND 12)";
            default:
              return "";
          }
        })
        .filter(Boolean);

      if (cycleConditions.length > 0) {
        filterConditions.push(`(${cycleConditions.join(" OR ")})`);
      }
    }

    if (search && search.length > 0) {
      let searchArray;
      try {
        searchArray = JSON.parse(search);
      } catch (e) {
        console.error("Error parsing search parameter:", e);
        searchArray = [];
      }

      if (Array.isArray(searchArray) && searchArray.length > 0) {
        const searchConditions = searchArray.map((filter) => {
          const column = filter.id;
          const value = String(filter.value);

          if (value.includes("BETWEEN")) {
            return `${column} ${value}`;
          } else if (column === "applicationStatus") {
            filterValues.push(value);
            return `${column} = ?`;
          }

          filterValues.push(`%${value}%`);
          return `${column} LIKE ?`;
        });

        if (searchConditions.length > 0) {
          filterConditions.push(`(${searchConditions.join(" AND ")})`);
        }
      }
    }

    if (globalFilter && globalFilter.trim() !== "") {
      const globalSearchConditions = [
        `ma.firstName LIKE '%${globalFilter}%'`,
        `ma.middleName LIKE '%${globalFilter}%'`,
        `ma.lastName LIKE '%${globalFilter}%'`,
        `ma.applicant_no LIKE '%${globalFilter}%'`,
        `ma.email LIKE '%${globalFilter}%'`,
        `ma.phone LIKE '%${globalFilter}%'`,
      ];

      searchFilters += searchFilters
        ? ` AND (${globalSearchConditions.join(" OR ")})`
        : `WHERE (${globalSearchConditions.join(" OR ")})`;
    }

    let sortingSql = "";

    if (sorting && sorting.length > 0) {
      const sortingArray = JSON.parse(sorting || "[]");
      if (Array.isArray(sortingArray) && sortingArray.length > 0) {
        const sortingConditions = sortingArray.map((sort) => {
          const column = sort.id;
          const direction = sort.desc ? "DESC" : "ASC"; 
          return `${column} ${direction}`;
        });
        sortingSql = `ORDER BY ${sortingConditions.join(", ")}`;
      }
    }

    // Add sorting logic
    let orderByClause = "";

    if (Array.isArray(sorting) && sorting.length > 0) {
      const sortingFields = sorting
        .map(({ id, desc }) => `${id} ${desc ? "DESC" : "ASC"}`)
        .join(", ");

      orderByClause = `ORDER BY ${sortingFields}`;
    }
    if (selectedYear) {
      filterConditions.push(`YEAR(ma.created_at) = ?`); 
      filterValues.push(parseInt(selectedYear, 10)); 
    }

    const whereClause =
      filterConditions.length > 0
        ? `WHERE ${filterConditions.join(" AND ")}`
        : "";

    sql = `
     SELECT 
  ma.*, 
  salutation_status.name AS salutation_name, 
  gender_status.name AS gender_name, 
  nationality_status.name AS nationality_name,

  -- Referee Emails Subquery
  (SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'refereeEmail', r.email, 
              'fullName', r.fullName,
              'id',rc.id,
              'status', CASE WHEN rc.refereeEmail IS NOT NULL THEN 1 ELSE 0 END,
              'overAllConsent', CASE WHEN rc.refereeEmail IS NOT NULL THEN rc.overAllConsent ELSE 0 END
            )
          )
   FROM referee AS r
   LEFT JOIN referee_consent AS rc 
     ON ma.id = rc.applicationId AND r.email = rc.refereeEmail
   WHERE r.applicationId = ma.id
  ) AS refereeEmails,

  -- Experience Subquery
  (SELECT JSON_ARRAYAGG(
            JSON_OBJECT(
              'id', e.id,
              'applicationId', e.applicationId,
              'type', e.type,
              'instituteName', e.instituteName,
              'designation', e.designation,
              'instituteAddress', e.instituteAddress,
              'workedFrom', e.workedFrom,
              'workedTill', e.workedTill,
              'noOfYears', e.noOfYears,
              'created_at', e.created_at
            )
          )
   FROM experience AS e
   WHERE e.applicationId = ma.id
  ) AS experiences`;

    if (req.query.userRole === "3" && req.query.user_id) {
      sql += `,
      -- Committee Consent Subquery: Fetch latest record
      (SELECT cc.consent 
       FROM commitee_consent AS cc
       WHERE cc.membership_id = ma.id AND member_id=?
       ORDER BY cc.created_at DESC 
       LIMIT 1) AS committeeConsent  -- Fetching the latest consent based on created_at
    `;
      filterValues.unshift(user_id);
    }
    sql += `

FROM 
  membership_application AS ma
LEFT JOIN 
  status salutation_status ON ma.salutation = salutation_status.id
LEFT JOIN 
  status gender_status ON ma.gender = gender_status.id
LEFT JOIN 
  status nationality_status ON ma.nationality = nationality_status.id `;

    if (req.query.userRole === "3") {
      sql += `
      LEFT JOIN 
        commitee_consent AS cc ON cc.membership_id = ma.id  
    `;
    }

    sql += `${searchFilters}`;

    sql += ` ${whereClause}`;

    if (req.query.userRole === "3") {
      sql += (whereClause ? " AND " : " WHERE ") + "ma.adminApprovalStatus = 1";
    }

    sql += `
GROUP BY ma.id
${sortingSql}
LIMIT ? OFFSET ? ;

    `;
    // ========== Old query ========

    // SELECT COUNT(*) as total FROM membership_application as ma
    // LEFT JOIN commitee_consent AS cc ON cc.membership_id = ma.id

    const totalSql = `SELECT COUNT(*) AS total FROM membership_application AS ma
    ${whereClause ? whereClause : ""} 
    ${
      req.query.userRole === "3"
        ? (whereClause ? " AND" : " WHERE") + " ma.adminApprovalStatus = 1"
        : ""
    }`;

    // Fetch paginated results
    const result = await queryDB(sql, [...filterValues, intLimit, intOffset]);
    if (req.query.userRole === "3" && req.query.user_id) {
      filterValues.shift();
    }
    // Fetch total records count
    const totalResult = await queryDB(totalSql, filterValues);
    const totalRecords = totalResult[0]?.total || 0;
    return res.status(200).json({
      success: true,
      status: 200,
      message: "Data Fetched Successfully",
      data: result,
      totalCount: totalRecords,
    });
  } catch (error) {
    console.error("Error:", error);
    return res.status(500).json({
      success: false,
      status: 500,
      message: "An error occurred while processing your request.",
      data: error.message ? { error: error.message } : [],
    });
  }
};

const updateDownloadStatus = async (req, res) => {
  console.log(req.params);

  try {
    const result = await updateDownloadStatusbyid(req.body);
    console.log(result);

    if (result.success) {
      res.status(result.status).json({
        ...returnObject,
        success: result.success,
        message: result.message,
        data: result,
      });
    } else {
      res.status(result.status).json({
        ...returnObject,
        success: result.success,
        message: result.message,
        data: result.data,
      });
    }
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "An internal server error occurred.",
    });
  }
};

const addGCApprovedData = async (req, res) => {

 try {

  
  const result = await insertGCApprovedData(req.body);
  console.log("result",result);
  if (result.success) {
    res.status(result.status).json({
      ...returnObject,
      success: result.success,
      message: result.message,
      data: result,
    });
  }else{
    res.status(result.status).json({
      ...returnObject,
      success: result.success,
      message: result.message,
      data: result.data,
    });
  }
 } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "An internal server error occurred.",
    });
  
 }};
   



const updateMemberShip = async (req, res) => {
  try {
    let result;

    if (req.body.applicationStatus && req.body.applicationStatus !== 0) {
      result = await updateApplicationStatus(req.body);
    } else {
      result = await updateMembershipData(req);
    }

    console.log(result);
    if (result.success) {
      res.status(result.status).json({
        ...returnObject,
        success: result.success,
        message: result.message,
        data: result,
      });
    } else {
      res.status(result.status).json({
        ...returnObject,
        success: result.success,
        message: result.message,
        data: result.data,
      });
    }
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "An internal server error occurred.",
    });
  }
};

const columnvisiblity = async (req, res) => {
  try {
    const result = await insertColumnVisibility(req.body);
    if (result.success) {
      res.status(result.status).json({
        ...returnObject,
        success: result.success,
        message: result.message,
        data: result,
      });
    } else {
      res.status(result.status).json({
        ...returnObject,
        success: result.success,
        message: result.message,
        data: result.data,
      });
    }
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "An internal server error occurred.",
    });
  }
};

const getcolumnvisiblity = async (req, res) => {
  let result;
  try {
    if (req.params) {
      result = await getColumnVisibility(req.params.userId);
    } else {
      result = await getColumnVisibility();
    }
    if (result.success) {
      res.status(result.status).json({
        ...returnObject,
        success: result.success,
        message: result.message,
        data: result,
      });
    } else {
      res.status(result.status).json({
        ...returnObject,
        success: result.success,
        message: result.message,
        data: result.data,
      });
    }
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "An internal server error occurred.",
    });
  }
};

const memberShipFetchById = async (req, res) => {
  try {
    const result = await getMembershipById(req.query);
    if (result.success) {
      res.status(result.status).json({
        ...returnObject,
        success: result.success,
        message: result.message,
        data: result,
      });
    } else {
      res.status(result.status).json({
        ...returnObject,
        success: result.success,
        message: result.message,
        data: result.data,
      });
    }
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "An internal server error occurred.",
    });
  }
};

const memberShipFetchByUserId = async (req, res) => {
  try {
    const result = await getMembershipByUserId(req.body);

    if (result.success) {
      res.status(result.status).json({
        ...returnObject,
        success: result.success,
        message: result.message,
        data: result,
      });
    } else {
      res.status(result.status).json({
        ...returnObject,
        success: result.success,
        message: result.message,
        data: result.data,
      });
    }
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "An internal server error occurred.",
    });
  }
};

const refereeConsent = async (req, res) => {
  try {
    const data = req.body;

    const result = await addRefereeConsentData(req.body);

    if (result.success) {
      res.status(result.status).json({
        ...returnObject,
        success: result.success,
        message: result.message,
        data: result,
      });
    } else {
      res.status(result.status).json({
        ...returnObject,
        success: result.success,
        message: result.message,
        data: result.data,
      });
    }
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "An internal server error occurred.",
    });
  }
};

const upgradeMembership = async (req, res) => {
  try {
    const result = await upgradeMembershipByAdmin(req.body);

    if (result.success) {
      res.status(result.status).json({
        ...returnObject,
        success: result.success,
        message: result.message,
        data: result,
      });
    } else {
      res.status(result.status).json({
        ...returnObject,
        success: result.success,
        message: result.message,
        data: result.data,
      });
    }
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "An internal server error occurred.",
    });
  }
};

const requestToUpdateApplication = async (req, res) => {
  try {
    const result = await requestPermissionToUpdateApplication(req.body);

    if (result.success) {
      res.status(result.status).json({
        ...returnObject,
        success: result.success,
        message: result.message,
        data: result,
      });
    } else {
      res.status(result.status).json({
        ...returnObject,
        success: result.success,
        message: result.message,
        data: result.data,
      });
    }
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "An internal server error occurred.",
    });
  }
};

const applicationUpdatePermit = async (req, res) => {
  try {
    const result = await applicationUpdatePermitService(req.body);
    if (result.success) {
      res.status(result.status).json({
        ...returnObject,
        success: result.success,
        message: result.message,
        data: result,
      });
    } else {
      res.status(result.status).json({
        ...returnObject,
        success: result.success,
        message: result.message,
        data: result.data,
      });
    }
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "An internal server error occurred.",
    });
  }
};

const makeDecisionForApplication = async (req, res) => {
  try {
    const result = await decisionForApplication(req.body);
    if (result.success) {
      res.status(result.status).json({
        ...returnObject,
        success: result.success,
        message: result.message,
        data: result,
      });
    } else {
      res.status(result.status).json({
        ...returnObject,
        success: result.success,
        message: result.message,
        data: result.data,
      });
    }
  } catch (error) {
    res.status(error.status || 500).json({
      success: false,
      message: error.message || "An internal server error occurred.",
    });
  }
};

module.exports = {
  addPayment,
  checkApplication,
  applyForMembership,
  memberShipList,
  updateMemberShip,
  memberShipFetchById,
  memberShipFetchByUserId,
  refereeConsent,
  getRefereeConsent,
  getcolumnvisiblity,
  columnvisiblity,
  getRefereeConsentData,
  addCommiteeConsent,
  upgradeMembership,
  getCommiteeConsent,
  updateDownloadStatus,
  requestToUpdateApplication,
  fetchUserStatus,
  applicationUpdatePermit,
  getCommiteeMemberCount,
  makeDecisionForApplication,
  addGCApprovedData,
  sendMembershipRenewalMail
};
