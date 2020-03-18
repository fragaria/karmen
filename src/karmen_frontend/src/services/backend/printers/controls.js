import { getHeaders } from "../utils";

const BASE_URL = window.env.BACKEND_BASE;

const performRequest = (
  { uri, uuid, data, method, successCodes, parseResponse } = {
    method: "POST",
    successCodes: [200, 202, 204],
    parseResponse: false
  }
) => {
  let fetchOpts = {
    method: "POST",
    headers: getHeaders()
  };
  if (data) {
    fetchOpts.body = JSON.stringify(data);
  }
  return fetch(uri, fetchOpts)
    .then(response => {
      if (successCodes.indexOf(response.status) === -1) {
        console.error(`Request failed: ${response.status}`);
      }
      if (parseResponse) {
        return response.json().then(data => {
          return { status: response.status, data: { uuid, ...data } };
        });
      }
      return { status: response.status, data: { uuid, ...data } };
    })
    .catch(e => {
      return { status: 500 };
    });
};

export const setPrinterConnection = (orgUuid, uuid, state) => {
  return performRequest({
    uri: `${BASE_URL}/organizations/${orgUuid}/printers/${uuid}/connection`,
    uuid,
    data: {
      state
    }
  });
};

export const changeCurrentJob = (orgUuid, uuid, action) => {
  return performRequest({
    uri: `${BASE_URL}/organizations/${orgUuid}/printers/${uuid}/current-job`,
    uuid,
    data: {
      action
    }
  });
};

export const changeLights = (orgUuid, uuid) => {
  return performRequest({
    uri: `${BASE_URL}/organizations/${orgUuid}/printers/${uuid}/lights`,
    uuid,
    parseResponse: true
  });
};

export const movePrinthead = (orgUuid, uuid, command, opts) => {
  return performRequest({
    uri: `${BASE_URL}/organizations/${orgUuid}/printers/${uuid}/printhead`,
    uuid,
    data: {
      command,
      ...opts
    }
  });
};

export const changeFanState = (orgUuid, uuid, targetState) => {
  return performRequest({
    uri: `${BASE_URL}/organizations/${orgUuid}/printers/${uuid}/fan`,
    uuid,
    data: {
      targetState
    }
  });
};

export const changeMotorsState = (orgUuid, uuid, targetState) => {
  return performRequest({
    uri: `${BASE_URL}/organizations/${orgUuid}/printers/${uuid}/motors`,
    uuid,
    data: {
      targetState
    }
  });
};

export const extrude = (orgUuid, uuid, amount) => {
  return performRequest({
    uri: `${BASE_URL}/organizations/${orgUuid}/printers/${uuid}/extrusion`,
    uuid,
    data: {
      amount
    }
  });
};

export const setTemperature = (orgUuid, uuid, partName, amount) => {
  return performRequest({
    uri: `${BASE_URL}/organizations/${orgUuid}/printers/${uuid}/temperatures/${partName}`,
    uuid,
    data: {
      amount
    }
  });
};
