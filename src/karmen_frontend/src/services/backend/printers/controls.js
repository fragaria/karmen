import { performRequest } from "../utils";

export const setPrinterConnection = (orgUuid, uuid, state) => {
  return performRequest({
    uri: `/organizations/${orgUuid}/printers/${uuid}/connection`,
    appendData: {
      uuid,
      state,
    },
    data: {
      state,
    },
    parseResponse: false,
  });
};

export const changeCurrentJob = (orgUuid, uuid, action) => {
  return performRequest({
    uri: `/organizations/${orgUuid}/printers/${uuid}/current-job`,
    appendData: {
      uuid,
      action,
    },
    data: {
      action,
    },
    parseResponse: false,
    successCodes: [204],
  });
};

export const changeLights = (orgUuid, uuid) => {
  return performRequest({
    uri: `/organizations/${orgUuid}/printers/${uuid}/lights`,
    appendData: {
      uuid,
    },
    successCodes: [200],
  });
};

export const movePrinthead = (orgUuid, uuid, command, opts) => {
  return performRequest({
    uri: `/organizations/${orgUuid}/printers/${uuid}/printhead`,
    appendData: {
      uuid,
    },
    data: {
      command,
      ...opts,
    },
    parseResponse: false,
    successCodes: [204],
  });
};

export const changeFanState = (orgUuid, uuid, targetState) => {
  return performRequest({
    uri: `/organizations/${orgUuid}/printers/${uuid}/fan`,
    appendData: {
      uuid,
    },
    data: {
      target: targetState,
    },
    parseResponse: false,
    successCodes: [204],
  });
};

export const changeMotorsState = (orgUuid, uuid, targetState) => {
  return performRequest({
    uri: `/organizations/${orgUuid}/printers/${uuid}/motors`,
    uuid,
    data: {
      target: targetState,
    },
    parseResponse: false,
    successCodes: [204],
  });
};

export const extrude = (orgUuid, uuid, amount) => {
  return performRequest({
    uri: `/organizations/${orgUuid}/printers/${uuid}/extrusion`,
    appendData: {
      uuid,
    },
    data: {
      amount,
    },
    parseResponse: false,
    successCodes: [204],
  });
};

export const setTemperature = (orgUuid, uuid, partName, target) => {
  return performRequest({
    uri: `/organizations/${orgUuid}/printers/${uuid}/temperatures/${partName}`,
    appendData: {
      uuid,
    },
    data: {
      target,
    },
    parseResponse: false,
    successCodes: [204],
  });
};

export const startUpdate = (orgUuid, uuid) => {
  return performRequest({
    uri: `/organizations/${orgUuid}/printers/${uuid}/update`,
    appendData: {
      uuid,
    },
    parseResponse: false,
    successCodes: [200],
  });
};
