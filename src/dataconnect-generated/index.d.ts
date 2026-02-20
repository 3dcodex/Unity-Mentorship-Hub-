import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, MutationRef, MutationPromise } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface AddNewScholarshipData {
  scholarship_insert: Scholarship_Key;
}

export interface AddNewScholarshipVariables {
  universityId: UUIDString;
  amount: number;
  applicationLink?: string | null;
  deadline?: TimestampString | null;
  description: string;
  eligibilityCriteria: string;
  name: string;
}

export interface ForumPost_Key {
  id: UUIDString;
  __typename?: 'ForumPost_Key';
}

export interface GetScholarshipsForUniversityData {
  scholarships: ({
    id: UUIDString;
    name: string;
    amount: number;
    description: string;
    deadline?: TimestampString | null;
    applicationLink?: string | null;
    eligibilityCriteria: string;
  } & Scholarship_Key)[];
}

export interface GetScholarshipsForUniversityVariables {
  universityId: UUIDString;
}

export interface GetUserProfileData {
  user?: {
    id: UUIDString;
    displayName: string;
    email: string;
    photoUrl?: string | null;
    bio?: string | null;
    university: {
      id: UUIDString;
      name: string;
    } & University_Key;
  } & User_Key;
}

export interface MentorshipRequest_Key {
  id: UUIDString;
  __typename?: 'MentorshipRequest_Key';
}

export interface Resource_Key {
  id: UUIDString;
  __typename?: 'Resource_Key';
}

export interface Scholarship_Key {
  id: UUIDString;
  __typename?: 'Scholarship_Key';
}

export interface University_Key {
  id: UUIDString;
  __typename?: 'University_Key';
}

export interface UpdateUserBioData {
  user_update?: User_Key | null;
}

export interface UpdateUserBioVariables {
  bio?: string | null;
}

export interface User_Key {
  id: UUIDString;
  __typename?: 'User_Key';
}

interface AddNewScholarshipRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: AddNewScholarshipVariables): MutationRef<AddNewScholarshipData, AddNewScholarshipVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: AddNewScholarshipVariables): MutationRef<AddNewScholarshipData, AddNewScholarshipVariables>;
  operationName: string;
}
export const addNewScholarshipRef: AddNewScholarshipRef;

export function addNewScholarship(vars: AddNewScholarshipVariables): MutationPromise<AddNewScholarshipData, AddNewScholarshipVariables>;
export function addNewScholarship(dc: DataConnect, vars: AddNewScholarshipVariables): MutationPromise<AddNewScholarshipData, AddNewScholarshipVariables>;

interface GetScholarshipsForUniversityRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetScholarshipsForUniversityVariables): QueryRef<GetScholarshipsForUniversityData, GetScholarshipsForUniversityVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: GetScholarshipsForUniversityVariables): QueryRef<GetScholarshipsForUniversityData, GetScholarshipsForUniversityVariables>;
  operationName: string;
}
export const getScholarshipsForUniversityRef: GetScholarshipsForUniversityRef;

export function getScholarshipsForUniversity(vars: GetScholarshipsForUniversityVariables): QueryPromise<GetScholarshipsForUniversityData, GetScholarshipsForUniversityVariables>;
export function getScholarshipsForUniversity(dc: DataConnect, vars: GetScholarshipsForUniversityVariables): QueryPromise<GetScholarshipsForUniversityData, GetScholarshipsForUniversityVariables>;

interface UpdateUserBioRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: UpdateUserBioVariables): MutationRef<UpdateUserBioData, UpdateUserBioVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: UpdateUserBioVariables): MutationRef<UpdateUserBioData, UpdateUserBioVariables>;
  operationName: string;
}
export const updateUserBioRef: UpdateUserBioRef;

export function updateUserBio(vars?: UpdateUserBioVariables): MutationPromise<UpdateUserBioData, UpdateUserBioVariables>;
export function updateUserBio(dc: DataConnect, vars?: UpdateUserBioVariables): MutationPromise<UpdateUserBioData, UpdateUserBioVariables>;

interface GetUserProfileRef {
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetUserProfileData, undefined>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect): QueryRef<GetUserProfileData, undefined>;
  operationName: string;
}
export const getUserProfileRef: GetUserProfileRef;

export function getUserProfile(): QueryPromise<GetUserProfileData, undefined>;
export function getUserProfile(dc: DataConnect): QueryPromise<GetUserProfileData, undefined>;

