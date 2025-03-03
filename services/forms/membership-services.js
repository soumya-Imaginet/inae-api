const queryDB = require("../../config/queryDb"); // Assuming queryDB is your DB handler
const queries = require("../../models/db/forms/membershipQueries");
const userQueries=require("../../models/db/user/userQueries");
const moment = require("moment"); // Import moment
const sendEmail = require("../../views/email/sendMail");
const { configs } = require("../../config/commonConfig");
const { runRenewalJob }=require("../../views/cronjobs/cronjobs");
 // Assuming you have a query config file

const insertReferee = async (refereeData = {}, membership_id) => {
  if (!refereeData) {
    throw { status: 400, message: "Referee data is required." };
  }
  try {
    const result = await queryDB(queries.insertReferee1Sql, [
      membership_id,
      refereeData.refereeFullName,
      refereeData.refereeDesignation,
      refereeData.refereeOrganization,
      refereeData.refereeMobileNumber,
      refereeData.refereeEmail,
    ]);

    return result.insertId;
  } catch (error) {
    console.error("Error inserting referee:", error);
    throw {
      status: 500,
      message: "Error inserting referee data into the database",
      error,
    };
  }
};

const getMembershipById = async (data) => {
  try {
    const sql = `
    SELECT 
            ma.*, 
            s1.name AS salutation_name, 
            s2.name AS gender_name,
            s3.name AS nationality_name
        FROM 
            membership_application AS ma
        LEFT JOIN 
            status AS s1 ON ma.salutation = s1.id
        LEFT JOIN 
            status AS s2 ON ma.gender = s2.id
        LEFT JOIN 
            status AS s3 ON ma.nationality = s3.id
      WHERE ma.id = ?
    `;

    const refereeSql = `
      SELECT * 
      FROM referee 
      WHERE applicationId = ?
    `;

    const experienceSql = `
      SELECT * 
      FROM experience 
      WHERE applicationId = ?
    `;

    let membershipResult, refereesResult, experiencesResult,designation;
    try {
      // Fetch membership_application data
      designation=await queryDB(userQueries.fetchDesignation,[data.id]);

      membershipResult = await queryDB(sql, [data.id]);

      // Fetch referees data
      refereesResult = await queryDB(refereeSql, [data.id]);

      // Fetch experiences data
      experiencesResult = await queryDB(experienceSql, [data.id]);
    } catch (err) {
      return {
        success: false,
        status: 400,
        message: "Something Went Wrong",
        data: [],
      };
    }

    if (membershipResult.length === 0) {
      return {
        success: false,
        status: 404,
        message: "Membership Application not found",
        data: [],
      };
    }

    return {
      success: true,
      status: 200,
      message: "Data Fetched Successfully",
      data: {
        membership: membershipResult[0],
        referees: refereesResult,
        designation,
        experiences: {
          academia: experiencesResult.filter((exp) => exp.type === "academia"),
          research: experiencesResult.filter((exp) => exp.type === "research"),
          industry: experiencesResult.filter((exp) => exp.type === "industry"),
          administration: experiencesResult.filter(
            (exp) => exp.type === "administration"
          ),
          others: experiencesResult.filter((exp) => exp.type === "others"),
        },
      },
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      success: false,
      status: 500,
      message: "An error occurred while processing your request.",
      data: error.message ? { error: error.message } : [],
    };
  }
};

const insertPayment = async (data) => {
  try {
    const sql = `INSERT INTO application_payment( application_id,user_id,payment,created_at) VALUES (?,?,?,?,?)`;
    const result = queryDB(sql, data);
  } catch (error) {}
};

const getMembershipByUserId = async (data) => {
  console.log("⛔ ➡️ file: membership-services.js:139 ➡️ data:", data);

  try {
    // SELECT *
    // FROM membership_application
    // WHERE created_by = ?

    const sql = `
        SELECT 
            ma.*, 
            s1.name AS salutation_name, 
            s2.name AS gender_name,
            s3.name AS nationality_name
        FROM 
            membership_application AS ma
        LEFT JOIN 
            status AS s1 ON ma.salutation = s1.id
        LEFT JOIN 
            status AS s2 ON ma.gender = s2.id
        LEFT JOIN 
            status AS s3 ON ma.nationality = s3.id
        WHERE 
            ma.created_by = ?
    `;

    const refereeSql = `
      SELECT * 
      FROM referee 
      WHERE applicationId = ?
    `;

    const experienceSql = `
      SELECT * 
      FROM experience 
      WHERE applicationId = ?
    `;

    let latestMembership, membershipResult, refereesResult, experiencesResult;
    try {
      // Fetch membership_application data
      membershipResult = await queryDB(sql, [data.userId]);

      latestMembership = membershipResult.reduce((latest, current) => {
        return new Date(current.created_at) > new Date(latest.created_at)
          ? current
          : latest;
      }, membershipResult[0]);

      // Fetch referees data
      refereesResult = await queryDB(refereeSql, [latestMembership.id]);

      // Fetch experiences data
      experiencesResult = await queryDB(experienceSql, [latestMembership.id]);
    } catch (err) {
      return {
        success: false,
        status: 400,
        message: "Something Went Wrong",
        data: [],
      };
    }

    if (membershipResult.length === 0) {
      return {
        success: false,
        status: 404,
        message: "Membership Application not found",
        data: [],
      };
    }

    return {
      success: true,
      status: 200,
      message: "Data Fetched Successfully",
      data: {
        membership: latestMembership,
        referees: refereesResult,
        experiences: {
          academia: experiencesResult.filter((exp) => exp.type === "academia"),
          research: experiencesResult.filter((exp) => exp.type === "research"),
          industry: experiencesResult.filter((exp) => exp.type === "industry"),
          administration: experiencesResult.filter(
            (exp) => exp.type === "administration"
          ),
        },
      },
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      success: false,
      status: 500,
      message: "An error occurred while processing your request.",
      data: error.message ? { error: error.message } : [],
    };
  }
};

const addCommiteeConsentData = async (data) => {
  console.log("🖥️👉🏻 ~ :230 ~ addCommiteeConsentData ~ data:", data);

  const {
    applicationId = null,
    user_id = null,
    commitee_member_status = null,
    suggestion = "",
    applicantName = "",
  } = data || {};

  try {
    if (suggestion !== null && suggestion !== "") {
      const updateSql = `
      UPDATE commitee_consent 
      SET suggestion = ? 
      WHERE membership_id = ? AND member_id = ?;
    `;

      const updateResult = await queryDB(updateSql, [
        suggestion,
        data.id,
        data.committeeId,
      ]);
      console.log(updateResult);
      return {
        success: true,
        status: 200,
        message: "Suggestion recorded successfully.",
        data: updateResult,
      };
    }

    console.log(data);
    const sql = `INSERT INTO commitee_consent (membership_id, member_id, consent)
  VALUES (?, ?, ?)
  ON DUPLICATE KEY UPDATE
    consent = VALUES(consent);
`;
    const result = await queryDB(sql, [
      applicationId,
      user_id,
      commitee_member_status,
    ]);
    console.log(result);
    await updateApplicationStatus(data);

    if (commitee_member_status == 2) {
      const thirdRefereesql3 = `SELECT * FROM referee WHERE applicationId = ? ORDER BY id DESC LIMIT 1;`;
      const refereeData = await queryDB(thirdRefereesql3, [applicationId]);

      const thirdeferee = refereeData[0]?.email || "";
      const refereeName = refereeData[0]?.fullName || "";

      const thirdRefereeEmailData = {
        applicantName: applicantName,
        refereeFullName: refereeName,
        referenceFormUrl: `${
          configs.APP_URL
        }/forms/referee-consent/${applicationId}?refereeEmail=${encodeURIComponent(
          thirdeferee
        )}&refereeIndex=${refereeData[0].refereeIndex}`,
      };
      const result = await sendEmail(
        thirdeferee,
        `Reference consent`,
        "referee-email",
        thirdRefereeEmailData
      );

      console.log("mail sent to third referee", thirdeferee);
      return {
        success: true,
        status: 200,
        message: `Mail Sent to Third Referee ${thirdeferee}`,
        data: result,
      };
    }

    return {
      success: true,
      status: 200,
      message: "Commitee Consent is Added Successfully.",
      data: result,
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      success: false,
      status: 500,
      message: "An error occurred while processing your request.",
      data: error.message ? { error: error.message } : [],
    };
  }
};

const updateDownloadStatusbyid = async (data) => {
  const { applicationId, downloadStatus } = data;

  const sql = `UPDATE membership_application
  SET downloadStatus = ? 
  WHERE id IN (?);`;

  const result = await queryDB(sql, [downloadStatus, applicationId]);
  console.log(result);
  return {
    success: true,
    status: 201,
    message: "application status updated",
    data: result,
  };
};

const updateApplicationStatus = async (req) => {
  try {
    if (
      req.applicationStatus &&
      req.applicationId &&
      req.role &&
      !req.adminApprovalStatus
    ) {
      const { applicationId, applicationStatus } = req;
      if (applicationStatus == 7 && req.userNames && req.userEmails) {
        req.userEmails.forEach((email, index) => {
          const emailData = {
            user_name: req.userNames[index],
            user_salutation: req.userSalutation[index],
            amount_due: "1000",
            payment_link: "http://localhost:3000/dashboard/user",
          };

          sendEmail(
            email,
            "Application Approved",
            "success-to-user",
            emailData
          );
          console.log("mail send to", email);
        });
      }

      const ids = Array.isArray(applicationId)
        ? applicationId
        : [applicationId];

      const sql = `UPDATE membership_application
    SET applicationStatus = ?
    WHERE id IN (?);`;
   
      result = await queryDB(sql, [applicationStatus, ids]);

      return {
        success: true,
        status: 201,
        message: "application status updated",
        data: result,
      };
    }

    if (req.id && req.commitee_member_status) {
      const { id, commitee_member_status } = req;

      const sql = `UPDATE membership_application
    SET commiteeMemberConsent = ?
    WHERE id = ?;`;
      result = await queryDB(sql, [commitee_member_status, id]);

      return {
        success: true,
        status: 201,
        message: "commitee Consent Updated Successfully.",
        data: result,
      };
    }

    if (req.adminApprovalStatus && req.role === 1) {
      const { applicationId, status, applicationStatus } = req;
      console.log(applicationStatus, applicationId);
      const sql = `UPDATE membership_application
      SET adminApprovalStatus = ? ,applicationStatus=?
      WHERE id = ?;`;
      result = await queryDB(sql, [status, applicationStatus, applicationId]);

      if (status != null) {
        if (status == 0) {
          // If status is 0, return early without sending emails or further processing
          return {
            success: true,
            status: 201,
            message: "Admin approval status Updated Successfully.",
            data: result,
          };
        }

        if (status == 1) {
          const sql2 = `SELECT * FROM user WHERE role=3`;
          const commiteeMembers = await queryDB(sql2);

          const sendEmailsToAll = async () => {
            try {
              const emailPromises = commiteeMembers.map((user) => {
                const emailData = {
                  commitee_member: user.first_name,
                };

                return sendEmail(
                  user.email,
                  "Committee Member Consent",
                  "commitee-member-consent",
                  emailData
                );
              });
              await Promise.all(emailPromises);

              console.log("All emails sent successfully!");
            } catch (error) {
              console.error("Error sending emails:", error);
            }
          };
          sendEmailsToAll();
          return {
            success: true,
            status: 201,
            message: "Mail sent to Commitee Members Successfully.",
            data: result,
          };
        } else if (status == 0) {
          return {
            success: true,
            status: 201,
            message: "commitee Consent Updated Successfully.",
            data: result,
          };
        }
      }
    }
  } catch (error) {
    return {
      success: false,
      status: 500,
      message: "An error occurred while processing your request.",
      data: error.message ? { error: error.message } : error,
    };
  }
};

const fetchUserStatusData = async (userId) => {
  const id = parseInt(userId, 10);
  try {
    const sql = `SELECT * 
FROM membership_application 
WHERE user_id = ?;
`;
    const result = await queryDB(sql, [id]);
    console.log(result);
    return {
      success: true,
      status: 201,
      message: "user data fetched Successfully.",
      data: result,
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      success: false,
      status: 500,
      message: "An error occurred while processing your request.",
      data: error.message ? { error: error.message } : [],
    };
  }
};

const triggerRenewAlertMail = async (userId) => {
  try {
  } catch (error) {
    console.error("Error:", error);
    return {
      success: false,
      status: 500,
      message: "An error occurred while processing your request.",
      data: error.message ? { error: error.message } : [],
    };
  }
};

const updateMembershipData = async (req) => {
  try {
    let {
      academia,
      research,
      industry,
      administration,
      others,
      referee1Id,
      referee2Id,
      referee3Id,

      ...userDetails
    } = req.body;

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
      // Check if a file is uploaded for the current field
      const file = req.files?.find((f) => f.fieldname === fieldName);
      if (file) {
        files[
          fieldName
        ] = `${configs.BASE_URL}/uploads/documents/${file.filename}`;
      }
    });

    // Merge file URLs into userDetails without overwriting existing values
    userDetails = {
      ...userDetails,
      ...fieldNames.reduce((acc, fieldName) => {
        // If `files[fieldName]` has a value, or `userDetails[fieldName]` is undefined, set it
        if (files[fieldName]) {
          acc[fieldName] = files[fieldName];
        } else if (!userDetails[fieldName]) {
          acc[fieldName] = null; // Only set null if the field doesn't already exist in `userDetails`
        }
        return acc;
      }, {}),
    };

    const referees = [
      {
        id: referee1Id,
        fullName: userDetails.referee1fullName,
        designation: userDetails.referee1Designation,
        affiliation: userDetails.referee1Affiliation,
        address: userDetails.referee1Address,
        email: userDetails.referee1Email,
        phone: userDetails.referee1Phone,
      },
      {
        id: referee2Id,
        fullName: userDetails.referee2fullName,
        designation: userDetails.referee2Designation,
        affiliation: userDetails.referee2Affiliation,
        address: userDetails.referee2Address,
        email: userDetails.referee2Email,
        phone: userDetails.referee2Phone,
      },
      {
        id: referee3Id,
        fullName: userDetails.referee3fullName,
        designation: userDetails.referee3Designation,
        affiliation: userDetails.referee3Affiliation,
        address: userDetails.referee3Address,
        email: userDetails.referee3Email,
        phone: userDetails.referee3Phone,
      },
    ];

    userDetails = deleteFields(userDetails); // delete referee fields from the main

    userDetails.dateOfBirth = moment(userDetails.dateOfBirth).format(
      "YYYY-MM-DD"
    );
    userDetails.passYear10th = userDetails.passYear10th
      ? parseInt(moment(userDetails.passYear10th).format("YYYY"), 10)
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

    userDetails.edit_permit = 0;

    // Insert user details
    const sql = `UPDATE membership_application SET ? WHERE id = ?`;

    try {
      result = await queryDB(sql, [userDetails, userDetails.id]);
    } catch (err) {
      return {
        success: false,
        status: 400,
        message: "Something Went Wrong",
        data: [],
      };
    }

    const applicationId = userDetails.id;

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
          await updateExperienceData(applicationId, exp.type, exp.data);
        }
      })
    );

    // Insert referees data
    if (referees && referees.length > 0) {
      await updateRefereeData(applicationId, referees);
    }

    return {
      success: true,
      status: 201,
      message: "Membership Application Updated Successfully.",
      data: { applicationId },
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      success: false,
      status: 500,
      message: "An error occurred while processing your request.",
      data: error.message ? { error: error.message } : [],
    };
  }
};

const addRefereeConsentData = async (data) => {
  try {
    const {
      applicantName,
      refereeName,
      refereeDesignation,
      organizationName,
      refereeKnowingCapacity,
      yearsKnown,
      academicBackground,
      engineeringInclination,
      engineeringContribution,
      ethicalStandard,
      additionalComment,
      applicationId,
      refereeEmail,
      overAllConsent,
      refereeIndex = null,
      applicationStatus = null,
      role = "",
      userId
    } = data;
    console.log(data);
    let emailData;

    // Check if the applicationId and refereeEmail combination already exists
    const checkSql = `
      SELECT COUNT(*) AS count 
      FROM referee_consent 
      WHERE applicationId = ? AND refereeEmail = ?;
    `;

    const checkResult = await queryDB(checkSql, [applicationId, refereeEmail]);

    if (checkResult[0].count > 0) {
      return {
        success: false,
        status: 409,
        message: "You have already given consent for this application.",
        //  "You have already given consent for this application."
        data: { applicationId, refereeEmail },
      };
    }
    const fetchDesignation = `SELECT designation,instituteName FROM experience WHERE applicationId=? AND currentlyWorking=1;
    `;

    const designation = await queryDB(fetchDesignation, [applicationId]);

    if (!checkResult[0].count > 0) {
      emailData = {
        applicant_Name: applicantName,
        designation: designation[0].designation,
      instituteName: designation[0].instituteName,

      };
      console.log("refeee",emailData)

      if (overAllConsent) {
        const payload = {
          applicationId,
          overAllConsent,
          applicationStatus,
          role,
        };
        const result = await updateApplicationStatus(payload);

        const sql2 = `SELECT COUNT(rc.id) AS consent_count, ma.email
     FROM referee_consent AS rc
     JOIN membership_application AS ma ON rc.applicationId= ma.id
     WHERE rc.overAllConsent = 35 AND rc.applicationId = ?
     GROUP BY ma.email;`;

        const thirdRefereesql3 = `SELECT * FROM referee WHERE applicationId = ? ORDER BY id DESC LIMIT 1;`;
        const refereeData = await queryDB(thirdRefereesql3, [applicationId]);
        console.log("djhjdj",refereeData);

        const fetchDesignation=await queryDB(userQueries.fetchDesignation,[applicationId]);
        console.log(fetchDesignation);
      
       
        const thirdeferee = refereeData[0].email;
        const thirdRefereeEmailData = {
          applicantName: applicantName || '',
          refereeFullName: refereeName || '',
          designation:fetchDesignation[0]?.designation || '',
          instituteName:fetchDesignation[0]?.instituteName || '',

          referenceFormUrl: `${
            configs.APP_URL
          }/forms/referee-consent/${applicationId}?refereeEmail=${encodeURIComponent(
            thirdeferee
          )}&refereeIndex=${refereeData[0].refereeIndex}`,
        };

        
console.log(overAllConsent);
        if (overAllConsent == 35) {
          //negative by referee

          const rejectConsentCount = await queryDB(sql2, [applicationId]);

          // console.log(rejectConsentCount[0].consent_count);

          if (rejectConsentCount[0]?.consent_count >= 1) {
            const email = rejectConsentCount[0].email;
            
            const result = await sendEmail(
              email,
              ` Application Status Notification`,
              "application-rejected",
              emailData
            );
            console.log("regret mail sent to ", email);
            console.log(emailData);
          } else {
            const result = await sendEmail(
              thirdeferee,
              `Reference consent`,
              "referee-email",
              thirdRefereeEmailData
            );

            console.log("mail sent to third referee", thirdeferee);
          }
        } else if (overAllConsent == 34) {
          const rejectConsentCount = await queryDB(sql2, [applicationId]);
          if (rejectConsentCount[0]?.consent_count > 1) {
            console.log(rejectConsentCount);
            const { email } = rejectConsentCount;
            console.log(rejectConsentCount[0].consent_count);
            const result = await sendEmail(
              email,
              ` Application Status Notification`,
              "application-rejected",
              emailData
            );

            console.log("regret mail sent to ", email);
          } else if (rejectConsentCount[0]?.consent_count == 1) {
            // const result = await sendEmail(
            //  thirdeferee ,
            //  `Reference consent`, "referee-email", emailData);

            const result = await sendEmail(
              thirdeferee,
              `Reference consent`,
              "referee-email",
              thirdRefereeEmailData
            );

            console.log("mail sent to third referee", thirdeferee);
          }
        }
      }
    }

    // Insert user details if no duplicate is found
    const insertSql = `
      INSERT INTO referee_consent (
          applicantName, refereeName, refereeDesignation, organizationName,
          refereeKnowingCapacity, yearsKnown, academicBackground, 
          engineeringInclination, engineeringContribution, 
          ethicalStandard, additionalComment, applicationId, refereeEmail,overAllConsent,refereeIndex
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?);
    `;

    const queryParams = [
      applicantName,
      refereeName,
      refereeDesignation,
      organizationName,
      refereeKnowingCapacity || null, // Optional fields can be set to null
      yearsKnown,
      academicBackground,
      engineeringInclination,
      engineeringContribution,
      ethicalStandard,
      additionalComment || null, // Optional fields can be set to null
      applicationId,
      refereeEmail,
      overAllConsent,
      refereeIndex,
    ];

    const result = await queryDB(insertSql, queryParams);

    return {
      success: true,
      status: 201,
      message: "Referee consent data submitted successfully.",
      data: { applicationId },
    };
  } catch (error) {
    console.error("Error:", error);
    return {
      success: false,
      status: 500,
      message: "An error occurred while inserting referee consent data.",
      data: error.message ? { error: error.message } : [],
    };
  }
};

const insertColumnVisibility = async (data) => {
  if (data) {
    const { user_id, column_name, is_visible } = data || {};
    const created_by = user_id; // Assuming `user_id` is the creator
    // Replace "test" with the appropriate table key

    try {
      const sql = `
        INSERT INTO column_visibility (column_name, is_visible, created_by)
        VALUES (?, ?, ?)
        ON DUPLICATE KEY UPDATE is_visible = VALUES(is_visible);
      `;

      const result = await queryDB(sql, [column_name, is_visible, created_by]);
      return {
        success: true,
        status: 201,
        message: "data inserted successfully.",
        data: result,
      };
    } catch (error) {
      console.error("Error inserting/updating column visibility:", error);
    }
  }
};

const getColumnVisibility = async (id) => {
  let sql;
  let result;
  let queryParams = [];
  try {
    sql = `
       SELECT t.column_name, t.is_visible FROM column_visibility t INNER JOIN ( SELECT column_name, MAX(id) AS latest_id FROM column_visibility GROUP BY column_name ) sub ON t.id = sub.latest_id
      `;
    if (id) {
      sql += `WHERE created_by = ?`;
      queryParams.push(id);
    }

    result = await queryDB(sql, queryParams);

    return {
      success: true,
      status: 201,
      message: "data fetched successfully.",
      data: result,
    };
  } catch (error) {
    console.error("Error inserting/updating column visibility:", error);
  }
};

const getRefereeConsentStatus = async () => {
  try {
    const sql = `SELECT r.applicationId, r.fullName as refereeName, r.email AS refereeEmail, CASE WHEN rc.refereeEmail IS NOT NULL THEN 1 ELSE 0 END AS consentStatus FROM referee r LEFT JOIN referee_consent rc ON r.applicationId = rc.applicationId AND r.email = rc.refereeEmail ORDER BY r.applicationId, r.email;`;
    const result = await queryDB(sql);

    return {
      success: true,
      status: 201,
      message: "Referee consent status fetched successfully.",
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      status: 500,
      message: "An error occurred while inserting referee consent data.",
      data: error.message ? { error: error.message } : [],
    };
  }
};

const getRefereeConsentDataById = async (id) => {
  try {
    const sql = `SELECT * FROM referee_consent WHERE id=?;`;
    const result = await queryDB(sql, [id]);

    return {
      success: true,
      status: 201,
      message: "Referee consent data fetched successfully.",
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      status: 500,
      message: "An error occurred while fetching referee data.",
      data: error.message ? { error: error.message } : [],
    };
  }
};

const getCommiteeConsentData = async (id) => {
  try {
    const sql = `SELECT cc.*,user.email,user.first_name FROM commitee_consent AS cc LEFT JOIN user on cc.member_id=user.id WHERE cc.membership_id = ?;`;
    const result = await queryDB(sql, [id]);

    return {
      success: true,
      status: 201,
      message: "Referee consent data fetched successfully.",
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      status: 500,
      message: "An error occurred while fetching referee data.",
      data: error.message ? { error: error.message } : [],
    };
  }
};

const getCommiteeCount = async () => {
  try {
    const sql2 = `SELECT COUNT(*) AS commitee_count FROM user WHERE role=3;`;
    const result2 = await queryDB(sql2);
    return {
      success: true,
      status: 201,
      message: "Commitee count fetched successfully.",
      data: result2,
    };
  } catch (error) {
    return {
      success: false,
      status: 500,
      message: "An error occurred while fetching referee data.",
      data: error.message ? { error: error.message } : [],
    };
  }
};
const checkApplicationCount = async (id) => {
  try {
    const sql = `SELECT COUNT(*) AS count FROM membership_application WHERE user_id = ?;`;
    const result = await queryDB(sql, [id]);

    return {
      success: true,
      status: 201,
      message: "Application count fetched successfully.",
      data: result[0].count,
    };
  } catch (error) {
    return {
      success: false,
      status: 500,
      message: "An error occurred while fetching application count.",
      data: error.message ? { error: error.message } : [],
    };
  }
};

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

const upgradeMembershipByAdmin = async (data) => {
  console.log("membershiptype",data)
  try {
    const { applicant, membershipCat, membershipTyp } = data;
    const fetchUserInfo = `
    SELECT 
        u.*, 
        salutation_status.name AS salutation_name
    FROM user u
    LEFT JOIN status salutation_status ON u.salutation = salutation_status.id
    JOIN membership_application ma ON ma.created_by = u.id
    WHERE ma.id = ?;
`;
    
 const fetchDesignation = `SELECT designation,instituteName FROM experience WHERE applicationId=? AND currentlyWorking=1;
 `;


    const salutation_name= await queryDB(fetchUserInfo,[applicant.id])
    const designation = await queryDB(fetchDesignation, [applicant.id]);
    

    
    const emailData = {
      applicant_Name: applicant.name,
      applicant_existing_membership_category:
        applicant.existingMembershipCategory,
      applicant_existing_membership_type: applicant.existingMembershipType,
      suggested_membership_category: membershipCat,
      suggested_membership_type: membershipTyp,
      salutation: salutation_name[0].salutation_name,
      designation: designation[0].designation,
      instituteName: designation[0].instituteName,
      // emailContent: emailContent,
      loginUrl: `${configs.APP_URL}/auth/login`,
    };

console.log("emaildataaa",emailData)   
    await sendEmail(
      applicant.email,
      `Upgrade Individual Membership`,
      "membership-upgrade-email",
      emailData
    );

    return {
      success: true,
      status: 200,
      message: "Membership upgrade email sent successfully.",
      data: [],
    };
  } catch (error) {
    return {
      success: false,
      status: 500,
      message: "An error occurred while sending email.",
      data: error.message ? { error: error.message } : [],
    };
  }
};

const requestPermissionToUpdateApplication = async (data) => {
  try {
    const { id, userId, userEmail, userName, salutation } = data;

    const sql = `SELECT email as user_email FROM user WHERE role = 1`;
    const fetchDesignation = `SELECT designation,instituteName FROM experience WHERE applicationId=? AND currentlyWorking=1;
    `;

    const fetchAdmins = await queryDB(sql, []);
    const designation = await queryDB(fetchDesignation, [id]);
    console.log("designation", designation);
    const emailData = {
      applicant_Name: userName,
      reviewURL: `${configs.APP_URL}/forms/membership/view/${id}`,
      designation: designation[0].designation,
      instituteName: designation[0].instituteName,
      salutation: salutation,
    };

    if (fetchAdmins.length > 0) {
      for (const admin of fetchAdmins) {
        await sendEmail(
          admin.user_email,
          `User Request to Update Application`,
          "user-review-application",
          emailData
        );
      }
    } else {
      return {
        success: false,
        status: 400,
        message: "No admin emails found.",
        data: [],
      };
    }

    return {
      success: true,
      status: 200,
      message: "Membership review email sent successfully.",
      data: [],
    };
  } catch (error) {
    return {
      success: false,
      status: 500,
      message: "An error occurred while sending email.",
      data: error.message ? { error: error.message } : [],
    };
  }
};

const applicationUpdatePermitService = async (data) => {
  try {
    let { applicationId, status, provisionTime } = data;

    if (typeof provisionTime == "string" || typeof provisionTime != "number") {
      provisionTime = parseInt(provisionTime);
    }

    const editPermitValidTo = new Date();
    editPermitValidTo.setDate(editPermitValidTo.getDate() + provisionTime);

    // Format the date as YYYY-MM-DD
    const formattedDate = editPermitValidTo.toISOString().split("T")[0];

    const updateSql = `UPDATE membership_application SET edit_permit = ? , edit_permit_valid_upto = ? WHERE id = ?;`;

    const fetchUserInfo = `
    SELECT 
        u.*, 
        salutation_status.name AS salutation_name
    FROM user u
    LEFT JOIN status salutation_status ON u.salutation = salutation_status.id
    JOIN membership_application ma ON ma.created_by = u.id
    WHERE ma.id = ?;
`;

    const fetchDesignation = `SELECT designation,instituteName FROM experience WHERE applicationId=? AND currentlyWorking=1;
`;

    const updateApplicationStatus = await queryDB(updateSql, [
      status,
      formattedDate,
      applicationId,
    ]);

    if (updateApplicationStatus.affectedRows > 0) {
      const userInfo = await queryDB(fetchUserInfo, [applicationId]);
      const designation = await queryDB(fetchDesignation, [applicationId]);

      if (userInfo.length > 0) {
        const emailData = {
          applicant_Name: `${userInfo[0].first_name} ${
            userInfo[0].middle_name ? userInfo[0].middle_name + " " : ""
          }${userInfo[0].last_name}`,
          provisionDate: moment(formattedDate).format("DD/MM/YYYY"),
          salutation: userInfo[0].salutation_name,
          designation: designation[0].designation,
          instituteName: designation[0].instituteName,
          status: status,
          updateURL: `${configs.APP_URL}/dashboard/user`,
        };

        await sendEmail(
          userInfo[0].email,
          `User Request to Update Application`,
          "user-update-application",
          emailData
        );
      }
    }
    return {
      success: true,
      status: 200,
      message: "Membership review email sent successfully.",
      data: [],
    };
  } catch (error) {
    return {
      success: false,
      status: 500,
      message: "An error occurred while sending email.",
      data: error.message ? { error: error.message } : [],
    };
  }
};

const decisionForApplication = async (data) => {   
  
  try {
    const { applicationId, type } = data;
    console.log("application",applicationId);
    const fetchCommitteeSql = `SELECT email, first_name, middle_name, last_name from user where role=3;`;
    const committeeRes = await queryDB(fetchCommitteeSql, []);

    const fetchApplicationSql = `SELECT * from membership_application where id=?`;
    
    const applicationRes = await queryDB(fetchApplicationSql, [applicationId]);
    
    const fetchUserInfo = `
    SELECT 
        u.*, 
        salutation_status.name AS salutation_name
    FROM user u
    LEFT JOIN status salutation_status ON u.salutation = salutation_status.id
    JOIN membership_application ma ON ma.created_by = u.id
    WHERE ma.id = ?;
`;
    
 const fetchDesignation = `SELECT designation,instituteName FROM experience WHERE applicationId=? AND currentlyWorking=1;
 `;


    const salutation_name= await queryDB(fetchUserInfo,[applicationId])
    const designation = await queryDB(fetchDesignation, [applicationId]);
   

    if (type == 1) {
      const meetingDateTime = moment(data.meetingTime).format(
        "DD-MM-YYYY hh:mm a"
      );

      if (committeeRes.length > 0 && applicationRes.length > 0) {
        for (const committeeMember of committeeRes) {
          const emailData = {
            applicationId,
            committeeName: `${committeeMember.first_name}${
              committeeMember.middle_name
                ? " " + committeeMember.middle_name
                : ""
            } ${committeeMember.last_name}`,
            type,
            meetingDateTime,
            applicantName: `${applicationRes[0].firstName}${
              applicationRes[0].middleName
                ? " " + applicationRes[0].middleName
                : ""
            } ${applicationRes[0].lastName}`,
            applicationCreatedTime: moment(applicationRes[0].created_at).format(
              "DD-MM-YYYY"
            ),
            salutation: salutation_name[0].salutation_name,
            designation: designation[0].designation,
            instituteName: designation[0].instituteName,
          };

          await sendEmail(
            committeeMember.email, // Extract the email address
            `Meeting Scheduled Notification`,
            "meeting-scheduled-email",
            emailData
          );
        }
      }
    } else if (type == 2) {
      const thirdRefereesql = `SELECT * FROM referee WHERE applicationId = ? ORDER BY id DESC LIMIT 1`;
      const refereeData = await queryDB(thirdRefereesql, [applicationId]);

      const thirdeferee = refereeData[0]?.email || "";
      const refereeName = refereeData[0]?.fullName || "";

      const thirdRefereeEmailData = {
        applicantName: `${applicationRes[0].firstName}${
          applicationRes[0].middleName ? " " + applicationRes[0].middleName : ""
        } ${applicationRes[0].lastName}`,
        refereeFullName: refereeName,
        referenceFormUrl: `${
          configs.APP_URL
        }/forms/referee-consent/${applicationId}?refereeEmail=${encodeURIComponent(
          thirdeferee
        )}&refereeIndex=${refereeData[0].refereeIndex}`,
      };

      const result = await sendEmail(
        thirdeferee,
        `Reference consent`,
        "referee-email",
        thirdRefereeEmailData
      );
    } else if (type == 3) {
      const emailData = {
        applicant_Name: `${applicationRes[0].firstName}${
          applicationRes[0].middleName ? " " + applicationRes[0].middleName : ""
        } ${applicationRes[0].lastName}`,
      };

      await sendEmail(
        applicationRes[0].email,
        `Application Status Notification`,
        "application-rejected",
        emailData
      );
    }

    return {
      success: true,
      status: 200,
      message:
        type == 1
          ? "Scheduled meeting email sent successfully"
          : type == 2
          ? "3rd referee consent email sent successfully."
          : "Application Ineligibility email sent successfully",
      data: [],
    };
  } catch (error) {
    return {
      success: false,
      status: 500,
      message: "An error occurred while sending email.",
      data: error.message ? { error: error.message } : [],
    };
  }
};

const membershipRenewalMail = async (applications) => {


  try {
    for (const application of applications) {
      const daysRemaining = Math.ceil((new Date(application.membershipEndDate) - new Date()) / (1000 * 3600 * 24));
      const endDate=  moment(application.membershipEndDate).format('DD-MM-YYYY');
      const emailData = {
        applicant_Name: application.firstName || '',
        membership_ID: application.application_no || '',
        
        membership_End_Date:endDate ,
        days_Remaining: daysRemaining || '', 
        login_url:`${configs.APP_URL}/dashboard/user` // Add the remaining days to the email content
      };

      console.log(emailData);
      if (daysRemaining === 30 || daysRemaining === 7 || daysRemaining === 1) {
        console.log(`Sending renewal reminder for ${daysRemaining} days remaining...`);
      await sendEmail(
        application.email,
        'Membership Renewal Reminder',
        'membership-renewal-reminder',
        emailData
      );
    }
    }

    return {
      success: true,
      status: 200,
      message: 'Membership renewal reminder email sent successfully.',
      data: [],
    };
  } catch (error) {
    console.error('Error in membershipRenewalMail:', error);
    return {
      success: false,
      status: 500,
      message: 'An error occurred while sending email.',
      data: error.message ? { error: error.message } : [],
    };
  }
};


const insertGCApprovedData = async (data) => {
  try {
  
    
    console.log("GCC",data);
 
    for(const application of data.data) {
      // Extract values from each application
      const membership_id = application.id;
      const membershipStartDate = moment(application.created_at).format('YYYY-MM-DD');

      const category=application.membershipTyp;
      let membershipEndDate;
      if (category === 1) {  // Per Annum (1 year)
        membershipEndDate = moment(application.created_at).add(1, 'year').format('YYYY-MM-DD');
      } else if (category === 2) {  // 5 years
        membershipEndDate = moment(application.created_at).add(5, 'years').format('YYYY-MM-DD');
      } else if (category === 3) {  // After Doctoral Degree (3 years)
        membershipEndDate = moment(application.created_at).add(3, 'years').format('YYYY-MM-DD');
      } else if (category === 4) {  // After Master’s Degree (3 years)
        membershipEndDate = moment(application.created_at).add(3, 'years').format('YYYY-MM-DD');
      } else if (category === 5) {  // After Bachelor’s Degree (5 years)
        membershipEndDate = moment(application.created_at).add(5, 'years').format('YYYY-MM-DD');
      } else if (category === 6) {  // During Doctorate (entire tenure)
        membershipEndDate = moment(application.created_at).add(1, 'year').format('YYYY-MM-DD');  // Assuming the entire tenure is one year, modify accordingly
      } else if (category === 7) {  // During Master’s Degree (2 years)
        membershipEndDate = moment(application.created_at).add(2, 'years').format('YYYY-MM-DD');
      } else if (category === 8) {  // During Bachelor’s Degree (4 years)
        membershipEndDate = moment(application.created_at).add(4, 'years').format('YYYY-MM-DD');
      }

      // Execute SQL insert for each application
     const sql=
        `INSERT INTO gc_approved_application 
         (membership_id, membershipStartDate, membershipEndDate) 
         VALUES (?, ?, ?)`;

         
    const result=await queryDB(sql,[membership_id, membershipStartDate, membershipEndDate]);
    
     
     
   
  }
  return {
    success: true,
    status: 200,
    message: "GC approval status updated successfully.",
    data: [],
  };
}catch (error) {
    return {  
      success: false,
      status: 500,
      message: "An error occurred while updating GC approval status.",
      data: error.message ? { error: error.message } : [],
    };
  } 
};


module.exports = {
  getCommiteeCount,
  membershipRenewalMail,
  insertPayment,
  insertGCApprovedData,
  triggerRenewAlertMail,
  checkApplicationCount,
  insertReferee,
  getMembershipById,
  getMembershipByUserId,
  updateMembershipData,
  insertDocument,
  addRefereeConsentData,
  getRefereeConsentStatus,
  insertColumnVisibility,
  getColumnVisibility,
  getRefereeConsentDataById,
  addCommiteeConsentData,
  upgradeMembershipByAdmin,
  getCommiteeConsentData,
  updateApplicationStatus,
  updateDownloadStatusbyid,
  fetchUserStatusData,
  requestPermissionToUpdateApplication,
  applicationUpdatePermitService,
  decisionForApplication,
};


const updateExperienceData = async (applicationId, type, experiences) => {
  console.log(
    "⛔ ➡️ file: membershipController.js:101 ➡️ experiences:",
    experiences
  );

  if (typeof experiences === "string") {
    experiences = JSON.parse(experiences); // Ensure it's parsed into a JavaScript array
  }

  // Check if experiences is an array
  if (!Array.isArray(experiences)) {
    throw new Error("Expected experiences to be an array after parsing.");
  }

  // Separate data into inserts and updates
  const inserts = [];
  const updates = [];

  const normalizeBoolean = (value) => {
    if (typeof value === 'string') {
      // Handle strings like "true", "false", "1", "0"
      return value.toLowerCase() === 'true' || value === '1' ? 1 : 0;
    }
    // Handle booleans or numbers
    return value ? 1 : 0;
  };



  experiences.forEach((exp) => {
  

    if (exp.id) {
      // If the record has an ID, it's an update
      updates.push([
        exp.instituteName,
        exp.designation,
        exp.instituteAddress,
        // moment(exp.workedFrom).format("YYYY-MM-DD"),
        // moment(exp.workedTill).format("YYYY-MM-DD"),
        moment(exp.workedFrom).format("YYYY-MM-DD"),  // Auto-parses ISO string
        moment(exp.workedTill).format("YYYY-MM-DD"),// Ensure correct format
        exp.noOfYears,
        normalizeBoolean(exp.currentlyWorking),
        exp.id,
      ]);
      

    } else {
      // Otherwise, it's an insert
      inserts.push([
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
    }
  });
  console.log("insert into exp", inserts);

  // Insert new records
  if (inserts.length > 0) {
    const insertSql = `
      INSERT INTO experience (applicationId, type, instituteName, designation, instituteAddress, workedFrom, workedTill, noOfYears,currentlyWorking)
      VALUES ?
    `;
    await queryDB(insertSql, [inserts]);
  }

  // Update existing records
  if (updates.length > 0) {
    const updateSql = `
      UPDATE experience
      SET 
        instituteName = ?,
        designation = ?,
        instituteAddress = ?,
        workedFrom = ?,
        workedTill = ?,
        noOfYears = ?,
        currentlyWorking = ?
      WHERE id = ?
    `;
    console.log("update into exp", updates);

    for (const update of updates) {
      await queryDB(updateSql, update);
    }
  }
};

const updateRefereeData = async (applicationId, referees) => {
  for (const ref of referees) {
    if (!ref.id) {
      throw new Error("Each referee must have an ID for updating.");
    }

    const sql = `
      UPDATE referee
      SET
        applicationId = ?,
        fullName = ?,
        designation = ?,
        affiliation = ?,
        address = ?,
        email = ?,
        phone = ?
      WHERE id = ?
    `;

    const values = [
      applicationId,
      ref.fullName,
      ref.designation,
      ref.affiliation,
      ref.address,
      ref.email,
      ref.phone,
      ref.id, // The ID for the WHERE clause
    ];

    await queryDB(sql, values); // Update each record individually
  }
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
