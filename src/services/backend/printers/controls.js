import { performRequest } from "../utils";

export const setPrinterConnection = (orgId, id, state) => {
  if (state === 'online') {
    return performRequest({
      uri: `/printers/${id}/connection/`,
      parseResponse: false,
      successCodes: [204],
    });
  }
  if (state === 'offline') {
    return performRequest({
      uri: `/printers/${id}/connection/`,
      method: 'DELETE',
      parseResponse: false,
      successCodes: [204],
    });
  }
};

export const changeCurrentJob = (orgId, id, action) => {
  return performRequest({
    uri: `/printers/${id}/current-job`,
    appendData: {
      id,
      action,
    },
    data: {
      action,
    },
    parseResponse: false,
    successCodes: [204],
  });
};

export const changeLights = (orgId, id) => {
  return performRequest({
    uri: `/groups/${orgId}/printers/${id}/lights`,
    appendData: {
      id,
    },
    successCodes: [200],
  });
};

export const movePrinthead = (orgId, id, command, opts) => {
  return performRequest({
    uri: `/groups/${orgId}/printers/${id}/printhead`,
    appendData: {
      id,
    },
    data: {
      command,
      ...opts,
    },
    parseResponse: false,
    successCodes: [204],
  });
};

export const changeFanState = (orgId, id, targetState) => {
  return performRequest({
    uri: `/groups/${orgId}/printers/${id}/fan`,
    appendData: {
      id,
    },
    data: {
      target: targetState,
    },
    parseResponse: false,
    successCodes: [204],
  });
};

export const changeMotorsState = (orgId, id, targetState) => {
  return performRequest({
    uri: `/groups/${orgId}/printers/${id}/motors`,
    id,
    data: {
      target: targetState,
    },
    parseResponse: false,
    successCodes: [204],
  });
};

export const extrude = (orgId, id, amount) => {
  return performRequest({
    uri: `/groups/${orgId}/printers/${id}/extrusion`,
    appendData: {
      id,
    },
    data: {
      amount,
    },
    parseResponse: false,
    successCodes: [204],
  });
};

export const setTemperature = (orgId, id, partName, target) => {
  return performRequest({
    uri: `/groups/${orgId}/printers/${id}/temperatures/${partName}`,
    appendData: {
      id,
    },
    data: {
      target,
    },
    parseResponse: false,
    successCodes: [204],
  });
};

export const startUpdate = (orgId, id) => {
  return performRequest({
    uri: `/groups/${orgId}/printers/${id}/update/`,
    appendData: {
      id,
    },
    parseResponse: false,
    successCodes: [200],
  });
};