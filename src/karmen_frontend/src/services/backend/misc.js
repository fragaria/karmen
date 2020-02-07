import { getHeaders } from "./utils";

const BASE_URL = window.env.BACKEND_BASE;

export const enqueueTask = task => {
  return fetch(`${BASE_URL}/tasks`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      task: task
    })
  })
    .then(response => {
      if (response.status !== 202) {
        console.error(`Cannot enqueue a task: ${response.status}`);
      }
      return { status: response.status };
    })
    .catch(e => {
      console.error(`Cannot enqueue a task: ${e}`);
      return { status: 500 };
    });
};

export const heartbeat = () => {
  return fetch(`${BASE_URL}/`, {
    headers: getHeaders()
  })
    .then(response => {
      if (response.status !== 200) {
        console.error(`Heartbeat fail: ${response.status}`);
        return false;
      }
      return true;
    })
    .catch(e => {
      console.error(`Heartbeat fail: ${e}`);
      return false;
    });
};
