import { getHeaders } from "../utils";

const BASE_URL = window.env.BACKEND_BASE;

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
  return fetch(`${BASE_URL}/organizations/${orgUuid}/printers`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      protocol,
      hostname,
      ip,
      port,
      path,
      token,
      name,
      api_key: apiKey
    })
  })
    .then(response => {
      if (response.status !== 201) {
        console.error(`Cannot add a printer: ${response.status}`);
        return { status: response.status };
      }
      return response.json().then(data => {
        return {
          status: response.status,
          data
        };
      });
    })
    .catch(e => {
      console.error(`Cannot add a printer: ${e}`);
      return {};
    });
};

export const patchPrinter = (orgUuid, uuid, data) => {
  return fetch(`${BASE_URL}/organizations/${orgUuid}/printers/${uuid}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(data)
  })
    .then(response => {
      if (response.status !== 200) {
        console.error(`Cannot patch a printer: ${response.status}`);
      }
      return response.json().then(data => {
        return { status: response.status, data };
      });
    })
    .catch(e => {
      console.error(`Cannot patch a printer: ${e}`);
      return {};
    });
};

export const deletePrinter = (orgUuid, uuid) => {
  return fetch(`${BASE_URL}/organizations/${orgUuid}/printers/${uuid}`, {
    method: "DELETE",
    headers: getHeaders()
  })
    .then(response => {
      if (response.status !== 204) {
        console.error(`Cannot remove a printer: ${response.status}`);
      }
      return { status: response.status, data: { uuid } };
    })
    .catch(e => {
      console.error(`Cannot remove a printer: ${e}`);
      return 500;
    });
};
