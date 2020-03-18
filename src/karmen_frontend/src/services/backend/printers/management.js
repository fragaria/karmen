import { performRequest } from "../utils";

export const addPrinter = (
  orgUuid,
  protocol,
  hostname,
  ip,
  port,
  path,
  token,
  name,
  apiKey
) => {
  return performRequest({
    uri: `/organizations/${orgUuid}/printers`,
    data: {
      protocol,
      hostname,
      ip,
      port,
      path,
      token,
      name,
      api_key: apiKey
    },
    appendData: {
      organizationUuid: orgUuid
    }
  });
};

export const patchPrinter = (orgUuid, uuid, data) => {
  return performRequest({
    uri: `/organizations/${orgUuid}/printers/${uuid}`,
    method: "PATCH",
    data,
    appendData: {
      organizationUuid: orgUuid
    }
  });
};
export const deletePrinter = (orgUuid, uuid) => {
  return performRequest({
    uri: `/organizations/${orgUuid}/printers/${uuid}`,
    method: "DELETE",
    appendData: {
      uuid
    },
    parseResponse: false
  });
};
