import { HttpError } from "../../errors";
import { performRequest } from "./utils";

export const enqueueTask = (orgUuid, task, opts) => {
  return performRequest({
    uri: `/organizations/${orgUuid}/tasks`,
    data: {
      task,
      ...opts,
    },
    parseResponse: false,
    successCodes: [202],
  });
};

export const heartbeat = () => {
  return performRequest({
    uri: "/",
    method: "GET",
    successCodes: [200],
  })
    .then((response) => response.data.version)
    .catch((err) => {
      if (err instanceof HttpError) {
        console.error(`Heartbeat fail: ${err.response.status}`);
      } else {
        console.error(`Heartbeat fail: ${err}`);
      }
      return -1;
    });
};
