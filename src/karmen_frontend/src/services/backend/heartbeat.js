import { performRequest } from "./utils";

export const heartbeat = () => {
  return performRequest({
    uri: "/",
    method: "GET",
    successCodes: [200],
  });
};
