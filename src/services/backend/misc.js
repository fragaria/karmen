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
