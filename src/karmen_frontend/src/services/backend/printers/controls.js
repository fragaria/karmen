import { getHeaders } from "../utils";

const BASE_URL = window.env.BACKEND_BASE;

export const setPrinterConnection = (orgUuid, uuid, state) => {
  return fetch(
    `${BASE_URL}/organizations/${orgUuid}/printers/${uuid}/connection`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({ state: state })
    }
  )
    .then(response => {
      if (response.status !== 204) {
        console.error(`Cannot connect a printer: ${response.status}`);
      }
      return { status: response.status, data: { uuid, state: state } };
    })
    .catch(e => {
      console.error(`Cannot connect a printer: ${e}`);
      return { status: 500 };
    });
};

export const changeCurrentJob = (orgUuid, uuid, action) => {
  return fetch(
    `${BASE_URL}/organizations/${orgUuid}/printers/${uuid}/current-job`,
    {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        action: action
      })
    }
  )
    .then(response => {
      if (response.status !== 204) {
        console.error(`Cannot change current job: ${response.status}`);
      }
      return { status: response.status, data: { uuid, action: action } };
    })
    .catch(e => {
      console.error(`Cannot change current job: ${e}`);
      return 500;
    });
};

export const changeLights = (orgUuid, uuid) => {
  return fetch(`${BASE_URL}/organizations/${orgUuid}/printers/${uuid}/lights`, {
    method: "POST",
    headers: getHeaders()
  })
    .then(response => {
      if (response.status !== 200) {
        console.error(`Cannot change lights status: ${response.status}`);
      }
      return response.json().then(data => {
        return { status: response.status, uuid, data };
      });
    })
    .catch(e => {
      console.error(`Cannot change lights status: ${e}`);
      return { status: 500 };
    });
};
