const bcrypt = require("bcrypt"); 

const { genSaltSync, hashSync, compare } = bcrypt; 

const encryptPassword = (password) => {
  const salt = genSaltSync(Number(process.env.SALT_ROUND)); 
  return hashSync(password, salt); 
};

const decryptPassword = async (storedPass, inputPass) => {
  const isMatch = await bcrypt.compare(inputPass, storedPass);
  return isMatch; 
};


module.exports = {
  encryptPassword,
  decryptPassword,
};
