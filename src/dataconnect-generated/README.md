# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `example`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`dataconnect-generated/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*GetScholarshipsForUniversity*](#getscholarshipsforuniversity)
  - [*GetUserProfile*](#getuserprofile)
- [**Mutations**](#mutations)
  - [*AddNewScholarship*](#addnewscholarship)
  - [*UpdateUserBio*](#updateuserbio)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `example`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@dataconnect/generated` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@dataconnect/generated';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## GetScholarshipsForUniversity
You can execute the `GetScholarshipsForUniversity` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getScholarshipsForUniversity(vars: GetScholarshipsForUniversityVariables): QueryPromise<GetScholarshipsForUniversityData, GetScholarshipsForUniversityVariables>;

interface GetScholarshipsForUniversityRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: GetScholarshipsForUniversityVariables): QueryRef<GetScholarshipsForUniversityData, GetScholarshipsForUniversityVariables>;
}
export const getScholarshipsForUniversityRef: GetScholarshipsForUniversityRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getScholarshipsForUniversity(dc: DataConnect, vars: GetScholarshipsForUniversityVariables): QueryPromise<GetScholarshipsForUniversityData, GetScholarshipsForUniversityVariables>;

interface GetScholarshipsForUniversityRef {
  ...
  (dc: DataConnect, vars: GetScholarshipsForUniversityVariables): QueryRef<GetScholarshipsForUniversityData, GetScholarshipsForUniversityVariables>;
}
export const getScholarshipsForUniversityRef: GetScholarshipsForUniversityRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getScholarshipsForUniversityRef:
```typescript
const name = getScholarshipsForUniversityRef.operationName;
console.log(name);
```

### Variables
The `GetScholarshipsForUniversity` query requires an argument of type `GetScholarshipsForUniversityVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface GetScholarshipsForUniversityVariables {
  universityId: UUIDString;
}
```
### Return Type
Recall that executing the `GetScholarshipsForUniversity` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetScholarshipsForUniversityData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `GetScholarshipsForUniversity`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getScholarshipsForUniversity, GetScholarshipsForUniversityVariables } from '@dataconnect/generated';

// The `GetScholarshipsForUniversity` query requires an argument of type `GetScholarshipsForUniversityVariables`:
const getScholarshipsForUniversityVars: GetScholarshipsForUniversityVariables = {
  universityId: ..., 
};

// Call the `getScholarshipsForUniversity()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getScholarshipsForUniversity(getScholarshipsForUniversityVars);
// Variables can be defined inline as well.
const { data } = await getScholarshipsForUniversity({ universityId: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getScholarshipsForUniversity(dataConnect, getScholarshipsForUniversityVars);

console.log(data.scholarships);

// Or, you can use the `Promise` API.
getScholarshipsForUniversity(getScholarshipsForUniversityVars).then((response) => {
  const data = response.data;
  console.log(data.scholarships);
});
```

### Using `GetScholarshipsForUniversity`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getScholarshipsForUniversityRef, GetScholarshipsForUniversityVariables } from '@dataconnect/generated';

// The `GetScholarshipsForUniversity` query requires an argument of type `GetScholarshipsForUniversityVariables`:
const getScholarshipsForUniversityVars: GetScholarshipsForUniversityVariables = {
  universityId: ..., 
};

// Call the `getScholarshipsForUniversityRef()` function to get a reference to the query.
const ref = getScholarshipsForUniversityRef(getScholarshipsForUniversityVars);
// Variables can be defined inline as well.
const ref = getScholarshipsForUniversityRef({ universityId: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getScholarshipsForUniversityRef(dataConnect, getScholarshipsForUniversityVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.scholarships);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.scholarships);
});
```

## GetUserProfile
You can execute the `GetUserProfile` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
getUserProfile(): QueryPromise<GetUserProfileData, undefined>;

interface GetUserProfileRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (): QueryRef<GetUserProfileData, undefined>;
}
export const getUserProfileRef: GetUserProfileRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
getUserProfile(dc: DataConnect): QueryPromise<GetUserProfileData, undefined>;

interface GetUserProfileRef {
  ...
  (dc: DataConnect): QueryRef<GetUserProfileData, undefined>;
}
export const getUserProfileRef: GetUserProfileRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the getUserProfileRef:
```typescript
const name = getUserProfileRef.operationName;
console.log(name);
```

### Variables
The `GetUserProfile` query has no variables.
### Return Type
Recall that executing the `GetUserProfile` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `GetUserProfileData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `GetUserProfile`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, getUserProfile } from '@dataconnect/generated';


// Call the `getUserProfile()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await getUserProfile();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await getUserProfile(dataConnect);

console.log(data.user);

// Or, you can use the `Promise` API.
getUserProfile().then((response) => {
  const data = response.data;
  console.log(data.user);
});
```

### Using `GetUserProfile`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, getUserProfileRef } from '@dataconnect/generated';


// Call the `getUserProfileRef()` function to get a reference to the query.
const ref = getUserProfileRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = getUserProfileRef(dataConnect);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.user);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.user);
});
```

# Mutations

There are two ways to execute a Data Connect Mutation using the generated Web SDK:
- Using a Mutation Reference function, which returns a `MutationRef`
  - The `MutationRef` can be used as an argument to `executeMutation()`, which will execute the Mutation and return a `MutationPromise`
- Using an action shortcut function, which returns a `MutationPromise`
  - Calling the action shortcut function will execute the Mutation and return a `MutationPromise`

The following is true for both the action shortcut function and the `MutationRef` function:
- The `MutationPromise` returned will resolve to the result of the Mutation once it has finished executing
- If the Mutation accepts arguments, both the action shortcut function and the `MutationRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Mutation
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `example` connector's generated functions to execute each mutation. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

## AddNewScholarship
You can execute the `AddNewScholarship` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
addNewScholarship(vars: AddNewScholarshipVariables): MutationPromise<AddNewScholarshipData, AddNewScholarshipVariables>;

interface AddNewScholarshipRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: AddNewScholarshipVariables): MutationRef<AddNewScholarshipData, AddNewScholarshipVariables>;
}
export const addNewScholarshipRef: AddNewScholarshipRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
addNewScholarship(dc: DataConnect, vars: AddNewScholarshipVariables): MutationPromise<AddNewScholarshipData, AddNewScholarshipVariables>;

interface AddNewScholarshipRef {
  ...
  (dc: DataConnect, vars: AddNewScholarshipVariables): MutationRef<AddNewScholarshipData, AddNewScholarshipVariables>;
}
export const addNewScholarshipRef: AddNewScholarshipRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the addNewScholarshipRef:
```typescript
const name = addNewScholarshipRef.operationName;
console.log(name);
```

### Variables
The `AddNewScholarship` mutation requires an argument of type `AddNewScholarshipVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface AddNewScholarshipVariables {
  universityId: UUIDString;
  amount: number;
  applicationLink?: string | null;
  deadline?: TimestampString | null;
  description: string;
  eligibilityCriteria: string;
  name: string;
}
```
### Return Type
Recall that executing the `AddNewScholarship` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `AddNewScholarshipData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface AddNewScholarshipData {
  scholarship_insert: Scholarship_Key;
}
```
### Using `AddNewScholarship`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, addNewScholarship, AddNewScholarshipVariables } from '@dataconnect/generated';

// The `AddNewScholarship` mutation requires an argument of type `AddNewScholarshipVariables`:
const addNewScholarshipVars: AddNewScholarshipVariables = {
  universityId: ..., 
  amount: ..., 
  applicationLink: ..., // optional
  deadline: ..., // optional
  description: ..., 
  eligibilityCriteria: ..., 
  name: ..., 
};

// Call the `addNewScholarship()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await addNewScholarship(addNewScholarshipVars);
// Variables can be defined inline as well.
const { data } = await addNewScholarship({ universityId: ..., amount: ..., applicationLink: ..., deadline: ..., description: ..., eligibilityCriteria: ..., name: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await addNewScholarship(dataConnect, addNewScholarshipVars);

console.log(data.scholarship_insert);

// Or, you can use the `Promise` API.
addNewScholarship(addNewScholarshipVars).then((response) => {
  const data = response.data;
  console.log(data.scholarship_insert);
});
```

### Using `AddNewScholarship`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, addNewScholarshipRef, AddNewScholarshipVariables } from '@dataconnect/generated';

// The `AddNewScholarship` mutation requires an argument of type `AddNewScholarshipVariables`:
const addNewScholarshipVars: AddNewScholarshipVariables = {
  universityId: ..., 
  amount: ..., 
  applicationLink: ..., // optional
  deadline: ..., // optional
  description: ..., 
  eligibilityCriteria: ..., 
  name: ..., 
};

// Call the `addNewScholarshipRef()` function to get a reference to the mutation.
const ref = addNewScholarshipRef(addNewScholarshipVars);
// Variables can be defined inline as well.
const ref = addNewScholarshipRef({ universityId: ..., amount: ..., applicationLink: ..., deadline: ..., description: ..., eligibilityCriteria: ..., name: ..., });

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = addNewScholarshipRef(dataConnect, addNewScholarshipVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.scholarship_insert);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.scholarship_insert);
});
```

## UpdateUserBio
You can execute the `UpdateUserBio` mutation using the following action shortcut function, or by calling `executeMutation()` after calling the following `MutationRef` function, both of which are defined in [dataconnect-generated/index.d.ts](./index.d.ts):
```typescript
updateUserBio(vars?: UpdateUserBioVariables): MutationPromise<UpdateUserBioData, UpdateUserBioVariables>;

interface UpdateUserBioRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: UpdateUserBioVariables): MutationRef<UpdateUserBioData, UpdateUserBioVariables>;
}
export const updateUserBioRef: UpdateUserBioRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `MutationRef` function.
```typescript
updateUserBio(dc: DataConnect, vars?: UpdateUserBioVariables): MutationPromise<UpdateUserBioData, UpdateUserBioVariables>;

interface UpdateUserBioRef {
  ...
  (dc: DataConnect, vars?: UpdateUserBioVariables): MutationRef<UpdateUserBioData, UpdateUserBioVariables>;
}
export const updateUserBioRef: UpdateUserBioRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the updateUserBioRef:
```typescript
const name = updateUserBioRef.operationName;
console.log(name);
```

### Variables
The `UpdateUserBio` mutation has an optional argument of type `UpdateUserBioVariables`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface UpdateUserBioVariables {
  bio?: string | null;
}
```
### Return Type
Recall that executing the `UpdateUserBio` mutation returns a `MutationPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `UpdateUserBioData`, which is defined in [dataconnect-generated/index.d.ts](./index.d.ts). It has the following fields:
```typescript
export interface UpdateUserBioData {
  user_update?: User_Key | null;
}
```
### Using `UpdateUserBio`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, updateUserBio, UpdateUserBioVariables } from '@dataconnect/generated';

// The `UpdateUserBio` mutation has an optional argument of type `UpdateUserBioVariables`:
const updateUserBioVars: UpdateUserBioVariables = {
  bio: ..., // optional
};

// Call the `updateUserBio()` function to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await updateUserBio(updateUserBioVars);
// Variables can be defined inline as well.
const { data } = await updateUserBio({ bio: ..., });
// Since all variables are optional for this mutation, you can omit the `UpdateUserBioVariables` argument.
const { data } = await updateUserBio();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await updateUserBio(dataConnect, updateUserBioVars);

console.log(data.user_update);

// Or, you can use the `Promise` API.
updateUserBio(updateUserBioVars).then((response) => {
  const data = response.data;
  console.log(data.user_update);
});
```

### Using `UpdateUserBio`'s `MutationRef` function

```typescript
import { getDataConnect, executeMutation } from 'firebase/data-connect';
import { connectorConfig, updateUserBioRef, UpdateUserBioVariables } from '@dataconnect/generated';

// The `UpdateUserBio` mutation has an optional argument of type `UpdateUserBioVariables`:
const updateUserBioVars: UpdateUserBioVariables = {
  bio: ..., // optional
};

// Call the `updateUserBioRef()` function to get a reference to the mutation.
const ref = updateUserBioRef(updateUserBioVars);
// Variables can be defined inline as well.
const ref = updateUserBioRef({ bio: ..., });
// Since all variables are optional for this mutation, you can omit the `UpdateUserBioVariables` argument.
const ref = updateUserBioRef();

// You can also pass in a `DataConnect` instance to the `MutationRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = updateUserBioRef(dataConnect, updateUserBioVars);

// Call `executeMutation()` on the reference to execute the mutation.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeMutation(ref);

console.log(data.user_update);

// Or, you can use the `Promise` API.
executeMutation(ref).then((response) => {
  const data = response.data;
  console.log(data.user_update);
});
```

