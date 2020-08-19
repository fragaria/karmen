import { performRequest } from "./utils";

export const getUsers = (orgId, fields = []) => {
  let uri = `/organizations/${orgId}/users`;
  if (fields && fields.length) {
    uri += `?fields=${fields.join(",")}`;
  }
  return performRequest({
    uri,
    method: "GET",
    successCodes: [200],
  });
};

export const addUser = (orgId, email, role) => {
  return performRequest({
    uri: `/organizations/${orgId}/users`,
    data: {
      email,
      role,
    },
    successCodes: [201],
  });
};

export const patchUser = (orgId, id, role) => {
  return performRequest({
    uri: `/organizations/${orgId}/users/${id}`,
    method: "PATCH",
    data: {
      role,
    },
    appendData: {
      id,
    },
    successCodes: [200],
  });
};

export const deleteUser = (orgId, id) => {
  return performRequest({
    uri: `/organizations/${orgId}/users/${id}`,
    method: "DELETE",
    parseResponse: false,
    successCodes: [204, 404],
    appendData: {
      id,
    },
  });
};
