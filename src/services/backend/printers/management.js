import { performRequest } from "../utils";

export const addPrinter = (
  orgId,
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
    uri: `/organizations/${orgId}/printers`,
    data: {
      protocol,
      hostname,
      ip,
      port,
      path,
      token,
      name,
      api_key: apiKey,
    },
    appendData: {
      organizationId: orgId,
    },
    successCodes: [201],
  });
};

export const patchPrinter = (orgId, id, data) => {
  return performRequest({
    uri: `/organizations/${orgId}/printers/${id}`,
    method: "PATCH",
    data,
    appendData: {
      organizationId: orgId,
    },
    successCodes: [200],
  });
};
export const deletePrinter = (orgId, id) => {
  return performRequest({
    uri: `/organizations/${orgId}/printers/${id}`,
    method: "DELETE",
    appendData: {
      id,
    },
    parseResponse: false,
    successCodes: [204, 404],
  });
};

export const issuePrinterToken = (orgId) => {
  return performRequest({
    uri: `/organizations/${orgId}/printers/issue-token`,
    method: "POST",
    successCodes: [201],
  });
};
