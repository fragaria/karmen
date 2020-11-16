import {
  HttpError,
  StreamUnavailableError,
  FailedToFetchDataError,
} from "../../../errors";
import { getJsonPostHeaders, performRequest } from "../utils";

const BASE_URL = window.env.BACKEND_BASE;

export const getPrinters = (orgId, fields = []) => {
  let uri = `/groups/${orgId}/printers/`;
  if (fields && fields.length) {
    uri += `?fields=${fields.join(",")}`;
  }
  return performRequest({
    method: "GET",
    uri,
    appendData: {
      organizationId: orgId,
    },
    successCodes: [200],
  });
};

export const getPrinter = (orgId, id, fields = []) => {
  let uri = `/printers/${id}/`;
  if (fields && fields.length) {
    uri += `?fields=${fields.join(",")}`;
  }
  return performRequest({
    method: "GET",
    uri,
    appendData: {
      organizationId: orgId,
    },
    successCodes: [200],
  });
};

// kudos https://medium.com/front-end-weekly/fetching-images-with-the-fetch-api-fb8761ed27b2
function arrayBufferToBase64(buffer) {
  var binary = "";
  var bytes = [].slice.call(new Uint8Array(buffer));
  bytes.forEach((b) => (binary += String.fromCharCode(b)));
  return window.btoa(binary);
}

export const getWebcamSnapshot = (snapshotUrl) => {
  if (!snapshotUrl) {
    return Promise.reject({ status: 404, successCodes: [200, 202] });
  }
  let headers = getJsonPostHeaders();
  headers.set("pragma", "no-cache");
  headers.set("cache-control", "no-cache");
  // TODO test snapshotUrl
  const fullSnapshotURL = `${BASE_URL}/${
    snapshotUrl[0] === "/" ? snapshotUrl.substr(1) : snapshotUrl
  }`;
  return fetch(fullSnapshotURL, {
    method: "GET",
    headers: headers,
  })
    .then((response) => {
      let contentType = response.headers.get("content-type");
      //OK responses, let's show stream to the user
      if ([200, 202].includes(response.status)) {
        return response.arrayBuffer().then((buffer) => ({
          status: response.status, // response.status,
          successCodes: [200, 202],
          data: {
            prefix: `data:${contentType ? contentType : "image/jpeg"};base64,`,
            data: arrayBufferToBase64(buffer),
          },
        }));
      }
      //No stream available - no reason to keep trying
      if (response.status === 404) {
        return Promise.reject(new StreamUnavailableError());
      }
      //These status codes failed, but they were expected.
      //When FailedToFetchDataError is thrown, parent function waits few seconds and then tries to fetch image again
      if ([502, 504, 408].includes(response.status)) {
        return Promise.reject(new FailedToFetchDataError());
      }

      // in case of unexpected response, we will not throw httperror, but just failed to fetch,
      // so there is no error and the streamer can try again later
      return Promise.reject(new FailedToFetchDataError());
    })
    .catch((err) => {
      // Only log down errors originating outside of this handler.
      if (!(err instanceof HttpError)) {
        console.error(`Cannot get webcam snapshot: ${err}`);
      }
      if (
        err instanceof TypeError &&
        err.toString() === "TypeError: Failed to fetch"
      ) {
        return Promise.reject(new FailedToFetchDataError());
      }
      throw err;
    });
};
