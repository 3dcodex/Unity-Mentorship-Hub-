import { AddNewScholarshipData, AddNewScholarshipVariables, GetScholarshipsForUniversityData, GetScholarshipsForUniversityVariables, UpdateUserBioData, UpdateUserBioVariables, GetUserProfileData } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions, UseDataConnectMutationResult, useDataConnectMutationOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult, UseMutationResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useAddNewScholarship(options?: useDataConnectMutationOptions<AddNewScholarshipData, FirebaseError, AddNewScholarshipVariables>): UseDataConnectMutationResult<AddNewScholarshipData, AddNewScholarshipVariables>;
export function useAddNewScholarship(dc: DataConnect, options?: useDataConnectMutationOptions<AddNewScholarshipData, FirebaseError, AddNewScholarshipVariables>): UseDataConnectMutationResult<AddNewScholarshipData, AddNewScholarshipVariables>;

export function useGetScholarshipsForUniversity(vars: GetScholarshipsForUniversityVariables, options?: useDataConnectQueryOptions<GetScholarshipsForUniversityData>): UseDataConnectQueryResult<GetScholarshipsForUniversityData, GetScholarshipsForUniversityVariables>;
export function useGetScholarshipsForUniversity(dc: DataConnect, vars: GetScholarshipsForUniversityVariables, options?: useDataConnectQueryOptions<GetScholarshipsForUniversityData>): UseDataConnectQueryResult<GetScholarshipsForUniversityData, GetScholarshipsForUniversityVariables>;

export function useUpdateUserBio(options?: useDataConnectMutationOptions<UpdateUserBioData, FirebaseError, UpdateUserBioVariables | void>): UseDataConnectMutationResult<UpdateUserBioData, UpdateUserBioVariables>;
export function useUpdateUserBio(dc: DataConnect, options?: useDataConnectMutationOptions<UpdateUserBioData, FirebaseError, UpdateUserBioVariables | void>): UseDataConnectMutationResult<UpdateUserBioData, UpdateUserBioVariables>;

export function useGetUserProfile(options?: useDataConnectQueryOptions<GetUserProfileData>): UseDataConnectQueryResult<GetUserProfileData, undefined>;
export function useGetUserProfile(dc: DataConnect, options?: useDataConnectQueryOptions<GetUserProfileData>): UseDataConnectQueryResult<GetUserProfileData, undefined>;
