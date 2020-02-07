import { getHeaders } from "./utils";

const BASE_URL = window.env.BACKEND_BASE;

export const changeSettings = settings => {
  return fetch(`${BASE_URL}/settings`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(settings)
  })
    .then(response => {
      if (response.status !== 201) {
        console.error(`Cannot change a setting: ${response.status}`);
      }
      return { status: response.status };
    })
    .catch(e => {
      console.error(`Cannot change a setting: ${e}`);
      return { status: 500 };
    });
};

export const getSettings = settings => {
  return fetch(`${BASE_URL}/settings`, { headers: getHeaders() })
    .then(response => {
      if (response.status !== 200) {
        console.error(`Cannot get settings: ${response.status}`);
      }
      return response.json().then(data => {
        return { status: response.status, data };
      });
    })
    .catch(e => {
      console.error(`Cannot get settings: ${e}`);
      return {};
    });
};
