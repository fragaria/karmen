import { performRequest } from "./utils";

export const enqueueTask = (orgUuid, task, opts) => {
  return performRequest({
    uri: `/organizations/${orgUuid}/tasks`,
    data: {
      task,
      ...opts
    },
    parseResponse: false
  });
};

export const heartbeat = () => {
  return performRequest({
    uri: "/",
    method: "GET"
  })
    .then(response => {
      if (response.status !== 200) {
        console.error(`Heartbeat fail: ${response.status}`);
        return -1;
      }
      return response.data.version;
    })
    .catch(e => {
      console.error(`Heartbeat fail: ${e}`);
      return -1;
    });
};
