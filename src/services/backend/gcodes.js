import { HttpError } from "../../errors";
import { getJsonPostHeaders, performRequest } from "./utils";

const BASE_URL = window.env.BACKEND_BASE;

export const getGcodes = (
  orgId,
  startWith = null,
  orderBy = null,
  displayFilter = null,
  limit = 15,
  fields = []
) => {
  let uri = `/groups/${orgId}/files/?limit=${limit}`;
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
    uri += `&search=${encodeURIComponent(displayFilter)}`;
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
    successCodes: [200],
  });
};

export const getGcode = (orgId, id, fields = []) => {
  let uri = `/groups/${orgId}/files/${id}/`;
  if (fields && fields.length) {
    uri += `?fields=${fields.join(",")}`;
  }
  return performRequest({
    uri,
    method: "GET",
    successCodes: [200],
  });
};

export const deleteGcode = (orgId, id) => {
  return performRequest({
    uri: `/groups/${orgId}/files/${id}/`,
    method: "DELETE",
    appendData: {
      id,
    },
    parseResponse: false,
    successCodes: [204, 404],
  });
};

export const uploadGcode = (orgId, path, file) => {
  var data = new FormData();
  data.append("file", file);
  // data.append("path", path);
  data.append("name", file.name)
  data.append("group", orgId)
  const headers = getJsonPostHeaders();
  headers.delete("content-type");
  console.log(BASE_URL)
  return fetch(`${BASE_URL}/users/me/files/`, {
    method: "POST",
    headers: headers,
    body: data,
  })
    .then((response) => {
      if (response.status !== 201) {
        console.error(`Cannot add a gcode: ${response.status}`);
        return Promise.reject(new HttpError(response, "Cannot add new gcode"));
      }
      return response.json().then((data) => {
        return { status: response.status, data, successCodes: [201] };
      });
    })
    .catch((err) => {
      console.error(`Cannot add a gcode: ${err}`);
      throw err;
    });
};
