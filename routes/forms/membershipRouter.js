const express = require("express");
const {
  applyForMembership,

  memberShipList,
  updateMemberShip,
  memberShipFetchById,
  refereeConsent,
  memberShipFetchByUserId,
  getRefereeConsent,
  getcolumnvisiblity,
  columnvisiblity,
  getRefereeConsentData,
  addCommiteeConsent,
  upgradeMembership,
  getCommiteeConsent,
  checkApplication,
  updateDownloadStatus,
  fetchUserStatus,
  addPayment,
  requestToUpdateApplication,
  applicationUpdatePermit,
  getCommiteeMemberCount,
  makeDecisionForApplication,
  addGCApprovedData,
  sendMembershipRenewalMail
} = require("../../controllers/forms/membershipController");

const fileUpload = require("../../helpers/fileUpload");
const multer = require("multer");
const upload = multer();
// const upload = fileUpload("uploads/membership", /jpeg|jpg|png/); // Configure for specific folder and file types
const router = express.Router();
const uploads = fileUpload("uploads/documents", /jpeg|jpg|png|pdf/);

// POST route for creating a new membership
// ! old form
// router.post("/create", upload.single("cvFile"), createMembership);

router.post("/individual-membership-form", uploads.any(), applyForMembership);
router.post("/membership-application-update", uploads.any(), updateMemberShip);
router.post("/referee-consent", refereeConsent);
router.get("/membership-fetch-id", memberShipFetchById);
router.post("/membership-fetch-user-id", memberShipFetchByUserId);
router.get("/individual-membership-list", memberShipList);
router.get("/referee-consent-status", getRefereeConsent);
router.post("/column-visiblity", columnvisiblity);
router.get("/column-visiblity", getcolumnvisiblity);
router.get("/column-visiblity/:userId", getcolumnvisiblity);
router.get("/referee-data-fetch/:id", getRefereeConsentData);
router.get("/commitee-consent-fetch/:id", getCommiteeConsent);
router.get("/commitee-member-count", getCommiteeMemberCount);
router.post('/add-gc-approved-data',addGCApprovedData);
router.post('/membership-renewal-mail',sendMembershipRenewalMail)

router.post("/update-downloadStatus", updateDownloadStatus);
router.get("/fetch-user-status/:userId", fetchUserStatus);
router.post("/request-to-update-application", requestToUpdateApplication);
router.get("/application-check", checkApplication);
router.post("/commitee-consent", addCommiteeConsent);
router.post("/email/memberShip-upgrade", upgradeMembership);
router.post("/application-update-permit", applicationUpdatePermit);
router.post("/decisions-for-application", makeDecisionForApplication);

module.exports = router;
