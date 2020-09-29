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
    uri: `/printers/${id}/lights`,
    appendData: {
      id,
    },
    successCodes: [200],
  });
};

export const movePrinthead = (orgId, id, command, opts) => {
  return performRequest({
    uri: `/printers/${id}/move_head/`,
    appendData: {
      id,
    },
    data: {
      ...opts,
    },
    parseResponse: false,
    successCodes: [201],
  });
};

export const changeFanState = (orgId, id, targetState) => {
  return performRequest({
    uri: `/printers/${id}/fan_state/`,
    appendData: {
      id,
    },
    data: {
      state: targetState,
    },
    parseResponse: false,
    successCodes: [201],
  });
};

export const changeMotorsState = (orgId, id, targetState) => {
  return performRequest({
    uri: `/printers/${id}/disable_motors/`,
    id,
    parseResponse: false,
    successCodes: [201],
  });
};

export const extrude = (orgId, id, amount) => {
  return performRequest({
    uri: `/printers/${id}/extrude/`,
    appendData: {
      id,
    },
    data: {
      amount,
    },
    parseResponse: false,
    successCodes: [201],
  });
};

export const setTemperature = (orgId, id, partName, target) => {
  return performRequest({
    uri: `/printers/${id}/temperature/`,
    appendData: {
      id,
    },
    data: {
      part: partName,
      temperature: target,
    },
    parseResponse: false,
    successCodes: [201],
  });
};

export const startUpdate = (orgId, id) => {
  return performRequest({
    uri: `/printers/${id}/update/`,
    appendData: {
      id,
    },
    parseResponse: false,
    successCodes: [201],
  });
};
