import { performRequest } from "./utils";

export const enqueueTask = (orgId, task, opts) => {
  return performRequest({
    uri: `/groups/${orgId}/tasks/`,
    data: {
      task,
      ...opts,
    },
    parseResponse: false,
    successCodes: [202],
  });
};
