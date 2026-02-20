const { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } = require('firebase/data-connect');

const connectorConfig = {
  connector: 'example',
  service: 'unitymentor-hub1',
  location: 'us-east4'
};
exports.connectorConfig = connectorConfig;

const addNewScholarshipRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'AddNewScholarship', inputVars);
}
addNewScholarshipRef.operationName = 'AddNewScholarship';
exports.addNewScholarshipRef = addNewScholarshipRef;

exports.addNewScholarship = function addNewScholarship(dcOrVars, vars) {
  return executeMutation(addNewScholarshipRef(dcOrVars, vars));
};

const getScholarshipsForUniversityRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetScholarshipsForUniversity', inputVars);
}
getScholarshipsForUniversityRef.operationName = 'GetScholarshipsForUniversity';
exports.getScholarshipsForUniversityRef = getScholarshipsForUniversityRef;

exports.getScholarshipsForUniversity = function getScholarshipsForUniversity(dcOrVars, vars) {
  return executeQuery(getScholarshipsForUniversityRef(dcOrVars, vars));
};

const updateUserBioRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateUserBio', inputVars);
}
updateUserBioRef.operationName = 'UpdateUserBio';
exports.updateUserBioRef = updateUserBioRef;

exports.updateUserBio = function updateUserBio(dcOrVars, vars) {
  return executeMutation(updateUserBioRef(dcOrVars, vars));
};

const getUserProfileRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetUserProfile');
}
getUserProfileRef.operationName = 'GetUserProfile';
exports.getUserProfileRef = getUserProfileRef;

exports.getUserProfile = function getUserProfile(dc) {
  return executeQuery(getUserProfileRef(dc));
};
