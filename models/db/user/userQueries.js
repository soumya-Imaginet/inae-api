const queries = {
  userInsertSql: `INSERT INTO 
                  user (role,applicant_no, salutation,otherSalutation, first_name, middle_name, last_name, gender, email, phone, password, otp, otp_valid_upto, status, verification, last_login, created_at ) 
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?, ?, ?, ?,?)
                  `,
  updateuserSql :`UPDATE 
                  user SET  salutation=?,otherSalutation=?, first_name=?, middle_name=?, last_name=?, gender=?, email=?, phone=?,role=?, status=? , profile_img=? WHERE id=?` ,
        

  checkDupEmailSql: `SELECT COUNT(*) AS user_count FROM user WHERE email = ?`,

  fetchOtpSql: `SELECT otp , otp_valid_upto from user WHERE id = ?`,
  fetchUserEmailSql: `SELECT u.*, 
  salutation_status.name AS salutation_name
  FROM user u
  LEFT JOIN status salutation_status ON u.salutation = salutation_status.id 
  WHERE email = ?`,
  
  fetchUsersSql: `SELECT user.*, 
  role.name AS role_label, 
  status.name AS status_label,
   gender_status.name AS gender_label FROM user JOIN role 
   ON user.role = role.id JOIN status ON user.status = status.id LEFT JOIN status AS gender_status 
   ON user.gender = gender_status.id`,

   fetchDesignation : `SELECT designation,instituteName FROM experience WHERE applicationId=? AND currentlyWorking=1;
  `,
  
   fetchUserIdSql: `SELECT 
   u.*, 
   salutation_status.name AS salutation_name
   FROM user u
   LEFT JOIN status salutation_status ON u.salutation = salutation_status.id
   WHERE u.id = ?;
;`,
  // fetchUserIdSql: `SELECT * FROM user WHERE id = ?`,
  updateUserOTPIdSql: `UPDATE user SET otp = ?, otp_valid_upto = ? WHERE id = ?`,
  updateUserOTPEmailSql: `UPDATE user SET otp = ?, otp_valid_upto = ? WHERE email = ?`,
  updateUserVerifySql: `UPDATE user SET verification = ? WHERE id = ?`,
  updateUserPassSql: `UPDATE user SET password = ? WHERE id = ? AND email = ?`,
  updateUserLoginTime: `UPDATE user SET last_login = ? WHERE id = ?`,
};

module.exports = queries;
