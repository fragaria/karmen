import { performRequest } from "./utils";

export const getUsers = (orgUuid, fields = []) => {
  let uri = `/organizations/${orgUuid}/users`;
  if (fields && fields.length) {
    uri += `?fields=${fields.join(",")}`;
  }
  return performRequest({
    uri,
    method: "GET"
  });
};

export const addUser = (orgUuid, email, role) => {
  return performRequest({
    uri: `/organizations/${orgUuid}/users`,
    data: {
      email,
      role
    }
  });
};

export const patchUser = (orgUuid, uuid, role) => {
  return performRequest({
    uri: `/organizations/${orgUuid}/users/${uuid}`,
    method: "PATCH",
    data: {
      role
    },
    appendData: {
      uuid
    }
  });
};

export const deleteUser = (orgUuid, uuid) => {
  return performRequest({
    uri: `/organizations/${orgUuid}/users/${uuid}`,
    method: "DELETE",
    parseResponse: false,
    successCodes: [204, 404],
    appendData: {
      uuid
    }
  });
};
