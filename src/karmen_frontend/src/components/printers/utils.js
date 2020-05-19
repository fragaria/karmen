export const isPrinting = (printer) => {
  return printer.status && printer.status.state === "Printing";
};

export const isConnected = (printer) => {
  return printer.client && printer.client.connected;
};
