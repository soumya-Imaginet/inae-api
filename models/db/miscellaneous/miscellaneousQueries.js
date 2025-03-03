const queries = {
  queryInsertSql: `INSERT INTO 
                  user_query (userId, query, resolved, resolved_at, created_at) 
                  VALUES (?, ?, ?, ?, ?)
                  `,
};

module.exports = queries;
