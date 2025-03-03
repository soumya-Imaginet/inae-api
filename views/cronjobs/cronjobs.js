// In cronjobs.js
const cron = require("node-cron");
const {
  membershipRenewalMail,
} = require("../../services/forms/membership-services");
const queryDB = require("../../config/queryDb");

const runRenewalJob = async () => {
  try {
    const sql = `
      SELECT gc.*, ma.firstName,ma.application_no,ma.email 
FROM gc_approved_application AS gc
LEFT JOIN membership_application AS ma ON gc.membership_id = ma.id;`;

    const result = await queryDB(sql);
    console.log("Found results.", result);

    if (result.length > 0) {
      console.log("Sending renewal reminder emails...");
      await membershipRenewalMail(result);
      console.log("Renewal reminder emails sent successfully!");
    } else {
      console.log("No memberships found for renewal reminder.");
    }

    return {
      success: true,
      message: "Cron job executed and emails sent successfully.",
    };
  } catch (error) {
    console.error("Error executing scheduled task:", error.message);
    return { success: false, message: `Error: ${error.message}` };
  }
};

// Schedule the cron job to run daily at midnight
cron.schedule("0 0 * * *", async () => {
  // Every day at midnight 0:00
  console.log("Cron job scheduled to run at midnight...");
  const result = await runRenewalJob();
  console.log(result.message);
});

module.exports = { runRenewalJob };
