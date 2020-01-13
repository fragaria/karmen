import { getHeaders } from './utils';

const BASE_URL = window.env.BACKEND_BASE;

export const getPrinters = (fields = []) => {
  let uri = `${BASE_URL}/printers`;
  if (fields && fields.length) {
    uri += `?fields=${fields.join(',')}`;
  }
  return fetch(uri, {
      headers: getHeaders()
    })
    .then((response) => {
      if (response.status !== 200) {
        console.error(`Cannot get list of printers: ${response.status}`);
      }
      return response.json()
        .then((data) => {
          return {status: response.status, data}
        })
    }).catch((e) => {
      console.error(`Cannot get list of printers: ${e}`);
      return {status: 500, data: {}};
    });
}

export const getPrinter = (host, fields = []) => {
  let uri = `${BASE_URL}/printers/${host}`;
  if (fields && fields.length) {
    uri += `?fields=${fields.join(',')}`;
  }
  return fetch(uri, {
      headers: getHeaders()
    })
    .then((response) => {
      if (response.status !== 200) {
        console.error(`Cannot get a printer: ${response.status}`);
      }
      return response.json()
        .then((data) => {
          return {status: response.status, data}
        })
    }).catch((e) => {
      console.error(`Cannot get a printer: ${e}`);
      return {};
    })
}

export const addPrinter = (protocol, host, name, apiKey) => {
  return fetch(`${BASE_URL}/printers`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      protocol,
      host,
      name,
      api_key: apiKey
    }),
  })
    .then((response) => {
      if (response.status !== 201) {
        console.error(`Cannot add a printer: ${response.status}`);
      }
      return response.json()
        .then((data) => {
          return {
            status: response.status, data
          }
        });
    }).catch((e) => {
      console.error(`Cannot add a printer: ${e}`);
      return {};
    })
}

export const patchPrinter = (host, data) => {
  return fetch(`${BASE_URL}/printers/${host}`, {
    method: 'PATCH',
    headers: getHeaders(),
    body: JSON.stringify(data),
  })
    .then((response) => {
      if (response.status !== 200) {
        console.error(`Cannot patch a printer: ${response.status}`);
      }
      return response.json()
        .then((data) => {
          return {status: response.status, data}
        })
    }).catch((e) => {
      console.error(`Cannot patch a printer: ${e}`);
      return {};
    })
}

export const setPrinterConnection = (host, state) => {
  return fetch(`${BASE_URL}/printers/${host}/connection`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({"state": state}),
  })
    .then((response) => {
      if (response.status !== 204) {
        console.error(`Cannot connect a printer: ${response.status}`);
      }
      return {status: response.status, data: {host, state: state}};
    }).catch((e) => {
      console.error(`Cannot connect a printer: ${e}`);
      return {status: 500};
    })
}

export const deletePrinter = (host) => {
  return fetch(`${BASE_URL}/printers/${host}`, {
      method: 'DELETE',
      headers: getHeaders(),
    })
    .then((response) => {
      if (response.status !== 204) {
        console.error(`Cannot remove a printer: ${response.status}`);
      }
      return {status: response.status, data: {host: host}};
    }).catch((e) => {
      console.error(`Cannot remove a printer: ${e}`);
      return 500;
    })
}

export const changeCurrentJob = (host, action) => {
  return fetch(`${BASE_URL}/printers/${host}/current-job`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({
      action: action,
    }),
  })
    .then((response) => {
      if (response.status !== 204) {
        console.error(`Cannot change current job: ${response.status}`);
      }
      return {status: response.status, data: {host: host, action: action}};
    }).catch((e) => {
      console.error(`Cannot change current job: ${e}`);
      return 500;
    });
}

// kudos https://medium.com/front-end-weekly/fetching-images-with-the-fetch-api-fb8761ed27b2
function arrayBufferToBase64(buffer) {
  var binary = '';
  var bytes = [].slice.call(new Uint8Array(buffer));
  bytes.forEach((b) => binary += String.fromCharCode(b));
  return window.btoa(binary);
};

export const getWebcamSnapshot = (snapshotUrl) => {
  let headers = getHeaders();
  headers.set("pragma", "no-cache");
  headers.set("cache-control", "no-cache");
  return fetch(`${BASE_URL}/${snapshotUrl[0] === '/' ? snapshotUrl.substr(1) : snapshotUrl}`, {
    method: 'GET',
    headers: headers,
  })
    .then((response) => {
      if (response.status === 202) {
        return 202;
      }
      if (response.status === 200) {
        let contentType = response.headers.get('content-type');
        return response.arrayBuffer().then((buffer) => ({
          prefix: `data:${contentType ? contentType : 'image/jpeg'};base64,`,
          data: arrayBufferToBase64(buffer)
        }));
      }
      console.error(`Cannot get webcam snapshot: ${response.status}`);
    }).catch((e) => {
      console.error(`Cannot get webcam snapshot: ${e}`);
      return 500;
    });
}
