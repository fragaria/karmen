import { performRequest } from "./utils";

export const heartbeat = () => {
  return performRequest({
    uri: "/ping/",
    method: "GET",
    successCodes: [200],
  });
};
