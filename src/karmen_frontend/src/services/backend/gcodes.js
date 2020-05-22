import { getJsonPostHeaders, performRequest } from "./utils";

const BASE_URL = window.env.BACKEND_BASE;

export const getGcodes = (
  orgUuid,
  startWith = null,
  orderBy = null,
  displayFilter = null,
  limit = 15,
  fields = []
) => {
  let uri = `/organizations/${orgUuid}/gcodes?limit=${limit}`;
  if (fields) {
    uri += `&fields=${fields.join(",")}`;
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
  return performRequest({
    uri,
    method: "GET",
    appendData: {
      startWith,
      orderBy,
      filter: displayFilter,
      limit,
      fields,
    },
  });
};

export const getGcode = (orgUuid, uuid, fields = []) => {
  let uri = `/organizations/${orgUuid}/gcodes/${uuid}`;
  if (fields && fields.length) {
    uri += `?fields=${fields.join(",")}`;
  }
  return performRequest({
    uri,
    method: "GET",
  });
};

export const deleteGcode = (orgUuid, uuid) => {
  return performRequest({
    uri: `/organizations/${orgUuid}/gcodes/${uuid}`,
    method: "DELETE",
    appendData: {
      uuid,
    },
    parseResponse: false,
    successCodes: [204, 404],
  });
};

export const uploadGcode = (orgUuid, path, file) => {
  var data = new FormData();
  data.append("file", file);
  data.append("path", path);
  const headers = getJsonPostHeaders();
  headers.delete("content-type");
  return fetch(`${BASE_URL}/organizations/${orgUuid}/gcodes`, {
    method: "POST",
    headers: headers,
    body: data,
  })
    .then((response) => {
      if (response.status !== 201) {
        console.error(`Cannot add a gcode: ${response.status}`);
        return {
          status: response.status,
          successCodes: [201],
        };
      }
      return response.json().then((data) => {
        return { status: response.status, data, successCodes: [201] };
      });
    })
    .catch((e) => {
      console.error(`Cannot add a gcode: ${e}`);
      return { status: 500, successCodes: [201] };
    });
};
