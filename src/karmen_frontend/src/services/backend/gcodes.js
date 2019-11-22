import { getHeaders } from './utils';

const BASE_URL = window.env.BACKEND_BASE;

export const getGcodes = (startWith = null, orderBy = null, displayFilter = null, limit = 15, fields = []) => {
  let uri = `${BASE_URL}/gcodes?limit=${limit}`;
  if (fields) {
    uri += `&fields=${fields.join(',')}`;
  }
  if (startWith) {
    uri += `&start_with=${encodeURIComponent(startWith)}`;
  }
  if (orderBy) {
    uri += `&order_by=${encodeURIComponent(orderBy)}`;
  }
  if (displayFilter) {
    uri += `&filter=display:${encodeURIComponent(displayFilter)}`;
  }
  return fetch(uri, {
      headers: getHeaders()
    })
    .then((response) => {
      if (response.status !== 200) {
        console.error(`Cannot get list of gcodes: ${response.status}`);
        return {
          "items": []
        };
      }
      return response.json();
    }).catch((e) => {
      console.error(`Cannot get list of gcodes: ${e}`);
      return {
        "items": []
      };
    });
}

export const getGcode = (id, fields = []) => {
  let uri = `${BASE_URL}/gcodes/${id}`;
  if (fields && fields.length) {
    uri += `?fields=${fields.join(',')}`;
  }
  return fetch(uri, {
      headers: getHeaders(),
    })
    .then((response) => {
      if (response.status !== 200) {
        console.error(`Cannot get a gcode: ${response.status}`);
        return;
      }
      return response.json();
    }).catch((e) => {
      console.error(`Cannot get a gcode: ${e}`);
      return {};
    })
}

export const deleteGcode = (id) => {
  return fetch(`${BASE_URL}/gcodes/${id}`, {
      method: 'DELETE',
      headers: getHeaders(),
    })
    .then((response) => {
      if (response.status !== 204) {
        console.error(`Cannot remove a gcode: ${response.status}`);
      }
      return response.status;
    }).catch((e) => {
      console.error(`Cannot remove a gcode: ${e}`);
      return 500;
    });
}

export const uploadGcode = (path, file) => { 
  var data = new FormData();
  data.append('file', file);
  data.append('path', path);
  const headers = getHeaders();
  headers.delete('content-type');
  return fetch(`${BASE_URL}/gcodes`, {
    method: 'POST',
    headers: headers,
    body: data,
  })
    .then((response) => {
      if (response.status !== 201) {
        console.error(`Cannot add a gcode: ${response.status}`);
      }
      return response.json()
        .then((data) => {
          return {status: response.status, data};
        });
    }).catch((e) => {
      console.error(`Cannot add a gcode: ${e}`);
      return {};
    });
}
