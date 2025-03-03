const { membershipCategoryList, membershipTypeList } = require("./constants");

const getMembershipCategoryName = (id) => {
  const category = membershipCategoryList.find((cat) => cat.id === id);
  return category ? category.name : "Not Assigned";
};

const getMembershipTypeName = (categoryName, id) => {
  const types = membershipTypeList[categoryName] || [];
  const type = types.find((typ) => typ.id === id);
  return type ? type.name : "Not Assigned";
};

module.exports = { getMembershipCategoryName, getMembershipTypeName };
