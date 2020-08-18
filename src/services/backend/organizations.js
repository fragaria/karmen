import { performRequest } from "./utils";

export const addOrganization = (name) => {
  return performRequest({
    uri: "/users/me/groups/",
    data: {
      name,
    },
    successCodes: [201],
  });
};

export const patchOrganization = (uuid, name) => {
  return performRequest({
    uri: `/users/me/groups/${uuid}`,
    method: "PATCH",
    data: {
      name,
    },
    successCodes: [200],
  });
};

export const getOrganizations = () => {
  return performRequest({
    uri: "/users/me/groups/",
    method: "GET",
    successCodes: [200],
  });
};
