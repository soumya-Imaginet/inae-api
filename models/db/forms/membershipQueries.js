const queries = {
  membershipInsertSql: `
      INSERT INTO membership_form (
        name, email, mobile_number, dob, gender, nationality, working_location, 
        permanent_address, permanent_pincode, official_address, official_pincode, 
        first_degree, other_degree, highest_degree, first_degree_year, highest_degree_year, 
        designation, organization, work_experience, cvURL,cvFile, eligibility,created_at
      ) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?,?,?,?)
    `,

  // Insert for referee1
  insertReferee1Sql: `
      INSERT INTO referees (membership_id, referee_full_name, referee_designation, referee_organization, referee_mobile_number, referee_email) 
      VALUES ( ?, ?, ?, ?, ?,?);
    `,

  fetchMemberships: `
    SELECT 
        mf.*, 
        r1.referee_full_name AS referee1_full_name, 
        r1.referee_designation AS referee1_designation, 
        r1.referee_organization AS referee1_organization, 
        r1.referee_mobile_number AS referee1_mobile_number, 
        r1.referee_email AS referee1_email,
        r2.referee_full_name AS referee2_full_name, 
        r2.referee_designation AS referee2_designation, 
        r2.referee_organization AS referee2_organization, 
        r2.referee_mobile_number AS referee2_mobile_number, 
        r2.referee_email AS referee2_email,
       DATE_FORMAT(mf.created_at, '%d, %M, %Y') AS formatted_created_at,
       DATE_FORMAT(mf.dob, '%d, %M, %Y') AS formatted_dob
    FROM 
        membership_form mf
    LEFT JOIN 
        referees r1 ON mf.id = r1.membership_id AND r1.id = (
            SELECT MIN(r.id) 
            FROM referees r 
            WHERE r.membership_id = mf.id
        )
    LEFT JOIN 
        referees r2 ON mf.id = r2.membership_id AND r2.id = (
            SELECT MAX(r.id) 
            FROM referees r 
            WHERE r.membership_id = mf.id
        )
    WHERE 1=1 -- Placeholder for dynamic filters
    `,
  fetchmemberById:`SELECT id ,firstname,middleName,lastName ,email FROM membership_application Where id = ?`,
  fetchMembershipsCount: `
    SELECT 
        COUNT(mf.id) AS total_count
    FROM 
        membership_form mf
    LEFT JOIN 
        referees r1 ON mf.id = r1.membership_id AND r1.id = (
            SELECT MIN(r.id) 
            FROM referees r 
            WHERE r.membership_id = mf.id
        )
    LEFT JOIN 
        referees r2 ON mf.id = r2.membership_id AND r2.id = (
            SELECT MAX(r.id) 
            FROM referees r 
            WHERE r.membership_id = mf.id
        )
    WHERE 1=1 -- Placeholder for dynamic filters
  `,
 
    insertDocuments: `INSERT INTO membership_application
     (
        tenthCertificateFile,
        academicDegreesFile,
        selfAttestedCV,
        endorsedCV,
        photograph,
        signature
    ) VALUES (?, ?, ?, ?, ?, ?);
    `,


};



module.exports = queries;
