import { queryRef, executeQuery, mutationRef, executeMutation, validateArgs } from 'firebase/data-connect';

export const connectorConfig = {
  connector: 'example',
  service: 'unitymentor-hub1',
  location: 'us-east4'
};

export const addNewScholarshipRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'AddNewScholarship', inputVars);
}
addNewScholarshipRef.operationName = 'AddNewScholarship';

export function addNewScholarship(dcOrVars, vars) {
  return executeMutation(addNewScholarshipRef(dcOrVars, vars));
}

export const getScholarshipsForUniversityRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars, true);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetScholarshipsForUniversity', inputVars);
}
getScholarshipsForUniversityRef.operationName = 'GetScholarshipsForUniversity';

export function getScholarshipsForUniversity(dcOrVars, vars) {
  return executeQuery(getScholarshipsForUniversityRef(dcOrVars, vars));
}

export const updateUserBioRef = (dcOrVars, vars) => {
  const { dc: dcInstance, vars: inputVars} = validateArgs(connectorConfig, dcOrVars, vars);
  dcInstance._useGeneratedSdk();
  return mutationRef(dcInstance, 'UpdateUserBio', inputVars);
}
updateUserBioRef.operationName = 'UpdateUserBio';

export function updateUserBio(dcOrVars, vars) {
  return executeMutation(updateUserBioRef(dcOrVars, vars));
}

export const getUserProfileRef = (dc) => {
  const { dc: dcInstance} = validateArgs(connectorConfig, dc, undefined);
  dcInstance._useGeneratedSdk();
  return queryRef(dcInstance, 'GetUserProfile');
}
getUserProfileRef.operationName = 'GetUserProfile';

export function getUserProfile(dc) {
  return executeQuery(getUserProfileRef(dc));
}

