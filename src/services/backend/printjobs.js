import { performRequest } from "./utils";

export const printGcode = (orgId, id, printer) => {
  return performRequest({
    uri: `/printers/${printer}/files/`,
    data: {
      file_id: id,
      print: true,
    },
    successCodes: [201],
    parseResponse: false,
  });
};

export const getPrinterJobs = (
  orgId,
  startWith = null,
  orderBy = null,
  printerFilter = null,
  limit = 10
) => {
  let uri = `/organizations/${orgId}/printjobs/?limit=${limit}`;
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
