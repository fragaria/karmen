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

export const patchOrganization = (id, name) => {
  return performRequest({
    uri: `/users/me/groups/${id}/`,
    method: "PATCH",
    data: {
      name,
    },
    successCodes: [200],
  });
};

export const getOrganizations = () => {
  return performRequest({
    uri: "/users/me/groups/?fields=role",
    method: "GET",
    successCodes: [200],
  });
};
