import { createActionThunk } from 'redux-thunk-actions';
import * as backend from '../services/backend';

export const loadPrinters = createActionThunk('PRINTERS_LOAD', (fields = []) => {
  return backend.getPrinters(fields);
});

export const loadPrinter = createActionThunk('PRINTERS_LOAD_DETAIL', (host, fields = []) => {
  return backend.getPrinter(host, fields);
});

export const addPrinter = createActionThunk('PRINTERS_ADD', (protocol, host, name, apiKey) => {
  return backend.addPrinter(protocol, host, name, apiKey);
});

export const patchPrinter = createActionThunk('PRINTERS_PATCH', (host, data) => {
  return backend.patchPrinter(host, data);
});

export const deletePrinter = createActionThunk('PRINTERS_DELETE', (host) => {
  return backend.deletePrinter(host)
    .then((r) => {
      if (r.status !== 204) {
        r.data.host = null;
      }
      return r;
    });
});

export const setPrinterConnection = createActionThunk('PRINTERS_SET_CONNECTION', (host, state) => {
  return backend.setPrinterConnection(host, state);
});

export const changeCurrentJob = createActionThunk('PRINTERS_CHANGE_JOB', (host, action) => {
  return backend.changeCurrentJob(host, action);
});
