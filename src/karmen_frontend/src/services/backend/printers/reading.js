import { getHeaders } from "../utils";

const BASE_URL = window.env.BACKEND_BASE;

export const getPrinters = (orgUuid, fields = []) => {
  let uri = `${BASE_URL}/organizations/${orgUuid}/printers`;
  if (fields && fields.length) {
    uri += `?fields=${fields.join(",")}`;
  }
  return fetch(uri, {
    headers: getHeaders()
  })
    .then(response => {
      if (response.status !== 200) {
        console.error(`Cannot get list of printers: ${response.status}`);
      }
      return response.json().then(data => {
        return { status: response.status, data };
      });
    })
    .catch(e => {
      console.error(`Cannot get list of printers: ${e}`);
      return { status: 500, data: {} };
    });
};

export const getPrinter = (orgUuid, uuid, fields = []) => {
  let uri = `${BASE_URL}/organizations/${orgUuid}/printers/${uuid}`;
  if (fields && fields.length) {
    uri += `?fields=${fields.join(",")}`;
  }
  return fetch(uri, {
    headers: getHeaders()
  })
    .then(response => {
      if (response.status !== 200) {
        console.error(`Cannot get a printer: ${response.status}`);
      }
      return response.json().then(data => {
        return { status: response.status, data };
      });
    })
    .catch(e => {
      console.error(`Cannot get a printer: ${e}`);
      return {};
    });
};

// kudos https://medium.com/front-end-weekly/fetching-images-with-the-fetch-api-fb8761ed27b2
function arrayBufferToBase64(buffer) {
  var binary = "";
  var bytes = [].slice.call(new Uint8Array(buffer));
  bytes.forEach(b => (binary += String.fromCharCode(b)));
  return window.btoa(binary);
}

export const getWebcamSnapshot = snapshotUrl => {
  if (!snapshotUrl) {
    return Promise.resolve({ status: 404 });
  }
  let headers = getHeaders();
  headers.set("pragma", "no-cache");
  headers.set("cache-control", "no-cache");
  // TODO test snapshotUrl
  return fetch(
    `${BASE_URL}/${
      snapshotUrl[0] === "/" ? snapshotUrl.substr(1) : snapshotUrl
    }`,
    {
      method: "GET",
      headers: headers
    }
  )
    .then(response => {
      if (response.status === 200) {
        let contentType = response.headers.get("content-type");
        return response.arrayBuffer().then(buffer => ({
          status: 200,
          data: {
            prefix: `data:${contentType ? contentType : "image/jpeg"};base64,`,
            data: arrayBufferToBase64(buffer)
          }
        }));
      }
      if (response.status !== 202) {
        console.error(`Cannot get webcam snapshot: ${response.status}`);
      }
      return { status: response.status };
    })
    .catch(e => {
      console.error(`Cannot get webcam snapshot: ${e}`);
      return { status: 500 };
    });
};
