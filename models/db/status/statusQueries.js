const queries = {
  fetchStatusSql: `SELECT id, name, position FROM status WHERE parent_id = ?`,
};

module.exports = queries;
