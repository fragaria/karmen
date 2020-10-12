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
    uri: `/printers/${id}/${action}/`,
    appendData: {
      id,
    },
    parseResponse: false,
    successCodes: [204],
  });
};

export const changeLights = (orgId, id, color) => {
  return performRequest({
    uri: `/printers/${id}/led/`,
    appendData: {
      id,
    },
    data: {
      color,
    },
    method: 'put',
    successCodes: [200],
  });
};

export const movePrinthead = (orgId, id, command, opts) => {
  const uriCmd = command === 'jog' ? 'move_head' : 'home_head'
  return performRequest({
    uri: `/printers/${id}/${uriCmd}/`,
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
