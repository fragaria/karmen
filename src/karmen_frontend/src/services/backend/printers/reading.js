import { HttpError } from "../../../errors";
import { getJsonPostHeaders, performRequest } from "../utils";

const BASE_URL = window.env.BACKEND_BASE;

export const getPrinters = (orgUuid, fields = []) => {
  let uri = `/organizations/${orgUuid}/printers`;
  if (fields && fields.length) {
    uri += `?fields=${fields.join(",")}`;
  }
  return performRequest({
    method: "GET",
    uri,
    appendData: {
      organizationUuid: orgUuid,
    },
    successCodes: [200],
  });
};

export const getPrinter = (orgUuid, uuid, fields = []) => {
  let uri = `/organizations/${orgUuid}/printers/${uuid}`;
  if (fields && fields.length) {
    uri += `?fields=${fields.join(",")}`;
  }
  return performRequest({
    method: "GET",
    uri,
    appendData: {
      organizationUuid: orgUuid,
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
      if (response.status === 404) {
        return Promise.reject(new HttpError("Stream not available"));
      }
      return response.arrayBuffer().then((buffer) => ({
        status: response.status, // response.status,
        successCodes: [200, 202],
        data: {
          prefix: `data:${contentType ? contentType : "image/jpeg"};base64,`,
          data: arrayBufferToBase64(buffer),
        },
      }));
    })
    .catch((err) => {
      // Only log down errors originating outside of this handler.
      if (!(err instanceof HttpError)) {
        console.error(`Cannot get webcam snapshot: ${err}`);
      }
      throw err;
    });
};
