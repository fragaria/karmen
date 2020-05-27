import { performRequest } from "./utils";

export const addOrganization = (name) => {
  return performRequest({
    uri: "/organizations",
    data: {
      name,
    },
    successCodes: [201],
  });
};

export const patchOrganization = (uuid, name) => {
  return performRequest({
    uri: `/organizations/${uuid}`,
    method: "PATCH",
    data: {
      name,
    },
    successCodes: [200],
  });
};

export const getOrganizations = () => {
  return performRequest({
    uri: "/organizations",
    method: "GET",
    successCodes: [200],
  });
};
