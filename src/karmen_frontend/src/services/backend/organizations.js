import { performRequest } from "./utils";

export const addOrganization = name => {
  return performRequest({
    uri: "/organizations",
    data: {
      name
    }
  });
};

export const patchOrganization = (uuid, name) => {
  return performRequest({
    uri: `/organizations/${uuid}`,
    method: "PATCH",
    data: {
      name
    }
  });
};

export const getOrganizations = () => {
  return performRequest({
    uri: "/organizations",
    method: "GET"
  });
};
