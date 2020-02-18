import { getHeaders } from "./utils";

const BASE_URL = window.env.BACKEND_BASE;

export const printGcode = (orgUuid, uuid, printer) => {
  return fetch(`${BASE_URL}/organizations/${orgUuid}/printjobs`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      gcode: uuid,
      printer: printer
    })
  })
    .then(response => {
      if (response.status !== 201) {
        console.error(`Cannot start a printjob: ${response.status}`);
      }
      return response.status;
    })
    .catch(e => {
      console.error(`Cannot start a printjob: ${e}`);
      return 500;
    });
};

export const getPrinterJobs = (
  orgUuid,
  startWith = null,
  orderBy = null,
  filter = null,
  limit = 10
) => {
  let uri = `${BASE_URL}/organizations/${orgUuid}/printjobs?limit=${limit}`;
  if (startWith) {
    uri += `&start_with=${encodeURIComponent(startWith)}`;
  }
  if (orderBy) {
    uri += `&order_by=${encodeURIComponent(orderBy)}`;
  }
  if (filter) {
    uri += `&filter=printer_uuid:${encodeURIComponent(filter)}`;
  }
  return fetch(uri, {
    headers: getHeaders()
  })
    .then(response => {
      if (response.status !== 200) {
        console.error(`Cannot get list of printjobs: ${response.status}`);
      }
      return response.json().then(data => {
        return { status: response.status, data };
      });
    })
    .catch(e => {
      console.error(`Cannot get list of printjobs: ${e}`);
      return {};
    });
};
