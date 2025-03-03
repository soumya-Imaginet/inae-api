const queryDB = require("../../config/queryDb");
const queries = require("../../models/db/miscellaneous/miscellaneousQueries");
const { configs } = require("../../config/commonConfig");

const getDashboardData = async (data) => {
  let cycleConditions = "";

  try {
    // Add cycle filter
    if (data.cycle.length > 0) {
      cycleConditions = data.cycle
        .map((c) => {
          switch (c) {
            case 1:
              return "(MONTH(created_at) BETWEEN 1 AND 3)";
            case 2:
              return "(MONTH(created_at) BETWEEN 4 AND 6)";
            case 3:
              return "(MONTH(created_at) BETWEEN 7 AND 9)";
            case 4:
              return "(MONTH(created_at) BETWEEN 10 AND 12)";
            default:
              return "";
          }
        })
        .filter(Boolean);
    }

    // Base sql query
    let query = `
    SELECT 
    -- General Counts
    (SELECT COUNT(*) FROM user) AS totalUsers,
    (SELECT COUNT(*) FROM membership_application WHERE user_id IN (SELECT id FROM user)) AS totalApplicants,
    (SELECT COUNT(*) FROM user WHERE role = 3) AS totalCommitteeMembers,
    (SELECT COUNT(*) FROM membership_application WHERE YEAR(created_at) = ${
      data.year
    } ${
      cycleConditions.length > 0 ? `AND (${cycleConditions.join(" OR ")})` : ""
    }) AS totalApplications,

    -- Separate Approved & Rejected Counts
    COUNT(CASE WHEN applicationStatus BETWEEN 1 AND 7 THEN 1 END) AS totalApproved,
    COUNT(CASE WHEN applicationStatus BETWEEN 8 AND 13 THEN 1 END) AS totalRejected,
    
    COUNT(CASE WHEN applicationStatus = 0 THEN 1 END) AS pending,

    -- Approved Breakdown
    COUNT(CASE WHEN applicationStatus = 1 THEN 1 END) AS approved_by_referee_1,
    COUNT(CASE WHEN applicationStatus = 2 THEN 1 END) AS approved_by_referee_2,
    COUNT(CASE WHEN applicationStatus = 3 THEN 1 END) AS approved_by_referee_3,
    COUNT(CASE WHEN applicationStatus = 4 THEN 1 END) AS approved_by_admin,
    COUNT(CASE WHEN applicationStatus = 5 THEN 1 END) AS approved_by_committee,
    COUNT(CASE WHEN applicationStatus = 6 THEN 1 END) AS to_be_discussed_by_committee,
    COUNT(CASE WHEN applicationStatus = 7 THEN 1 END) AS approved_by_gc,

    -- Rejected Breakdown
    COUNT(CASE WHEN applicationStatus = 8 THEN 1 END) AS rejected_by_referee_1,
    COUNT(CASE WHEN applicationStatus = 9 THEN 1 END) AS rejected_by_referee_2,
    COUNT(CASE WHEN applicationStatus = 10 THEN 1 END) AS rejected_by_referee_3,
    COUNT(CASE WHEN applicationStatus = 11 THEN 1 END) AS rejected_by_admin,
    COUNT(CASE WHEN applicationStatus = 12 THEN 1 END) AS rejected_by_committee,
    COUNT(CASE WHEN applicationStatus = 13 THEN 1 END) AS rejected_by_gc

    FROM membership_application
    WHERE YEAR(created_at) = ${data.year} ${
      cycleConditions.length > 0 ? `AND (${cycleConditions.join(" OR ")})` : ""
    }
    `;

    const membershipQuery = `
      SELECT t.membershipTyp as id, COUNT(ma.membershipTyp) AS total_count FROM ( SELECT 1 AS membershipTyp UNION ALL SELECT 2 UNION ALL SELECT 3 UNION ALL SELECT 4 UNION ALL SELECT 5 UNION ALL SELECT 6 UNION ALL SELECT 7 UNION ALL SELECT 8 ) AS t LEFT JOIN membership_application AS ma ON t.membershipTyp = ma.membershipTyp AND ma.applicationStatus = 7 GROUP BY t.membershipTyp ORDER BY t.membershipTyp;
    `;

    const [result] = await queryDB(query);
    const membershipData = await queryDB(membershipQuery);
    console.log("🚀 ~ getDashboardData ~ membershipData:", membershipData);

    return {
      success: true,
      status: 201,
      message: "Dashboard data fetched successfully.",
      data: {
        totalUsers: result.totalUsers,
        totalApplicants: result.totalApplicants,
        totalCommitteeMembers: result.totalCommitteeMembers,
        totalApplications: result.totalApplications,
        applicationStatus: {
          pending: result.pending || 0,
          approved: {
            total: result.totalApproved,
            by_referee_1: result.approved_by_referee_1,
            by_referee_2: result.approved_by_referee_2,
            by_referee_3: result.approved_by_referee_3,
            by_admin: result.approved_by_admin,
            by_committee: result.approved_by_committee,
            to_be_discussed_by_committee: result.to_be_discussed_by_committee,
            by_gc: result.approved_by_gc,
          },
          rejected: {
            total: result.totalRejected,
            by_referee_1: result.rejected_by_referee_1,
            by_referee_2: result.rejected_by_referee_2,
            by_referee_3: result.rejected_by_referee_3,
            by_admin: result.rejected_by_admin,
            by_committee: result.rejected_by_committee,
            by_gc: result.rejected_by_gc,
          },
        },
        membershipData: membershipData
      },
    };
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return {
      success: false,
      status: 500,
      message: "An internal server error occurred.",
      data: {},
    };
  }
};

module.exports = { getDashboardData };
