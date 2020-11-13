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
    uri: `/printers/`,
    data: {
      protocol,
      hostname,
      ip,
      port,
      path,
      token,
      name,
      api_key: apiKey,
      groups: [orgId],
    },
    appendData: {
      group: orgId,
    },
    successCodes: [201],
  });
};

export const patchPrinter = (orgId, id, data) => {
  return performRequest({
    uri: `/printers/${id}/`,
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
    uri: `/groups/${orgId}/printers/${id}/`,
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
    uri: `/device_keys/`,
    method: "POST",
    successCodes: [200],
  });
};
