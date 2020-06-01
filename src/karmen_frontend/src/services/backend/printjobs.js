import { performRequest } from "./utils";

export const printGcode = (orgUuid, uuid, printer) => {
  return performRequest({
    uri: `/organizations/${orgUuid}/printjobs`,
    data: {
      gcode: uuid,
      printer,
    },
    successCodes: [201],
  });
};

export const getPrinterJobs = (
  orgUuid,
  startWith = null,
  orderBy = null,
  printerFilter = null,
  limit = 10
) => {
  let uri = `/organizations/${orgUuid}/printjobs?limit=${limit}`;
  if (startWith) {
    uri += `&start_with=${encodeURIComponent(startWith)}`;
  }
  if (orderBy) {
    uri += `&order_by=${encodeURIComponent(orderBy)}`;
  }
  if (printerFilter) {
    uri += `&filter=printer_uuid:${encodeURIComponent(printerFilter)}`;
  }
  return performRequest({
    uri,
    method: "GET",
    appendData: {
      startWith,
      orderBy,
      filter: printerFilter,
      limit,
      printer: printerFilter,
    },
    successCodes: [200],
  });
};
