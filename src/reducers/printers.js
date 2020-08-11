const statesMapping = {
  pause: "Paused",
  resume: "Printing",
  cancel: "Cancelling",
  offline: "Offline",
  online: "Connecting",
};

const getSortedPrinters = (printers) => {
  return [].concat(printers).sort((p, r) => {
    let result = -1;
    if (p.name > r.name) {
      result = 1;
    } else if (p.name === r.name) {
      result = p.ip > r.ip ? 1 : -1;
    }
    return result;
  });
};

const initialState = {
  activeOrganizationUuid: null,
  printersLoaded: false,
  printers: [],
  toBeDeleted: [],
  checkQueue: {},
};

export default (
  state = {
    activeOrganizationUuid: null,
    printersLoaded: false,
    printers: [],
    toBeDeleted: [],
    checkQueue: {},
  },
  action
) => {
  const { printers, activeOrganizationUuid, checkQueue } = state;
  let newPrinter, origPrinter, origPrinterIndex;
  switch (action.type) {
    case "PRINTERS_POLL_INTERVAL_SET":
      return Object.assign({}, state, {
        checkQueue: Object.assign({}, state.checkQueue, {
          [action.payload.uuid]: action.payload.interval,
        }),
      });
    case "PRINTERS_LOAD_SUCCEEDED":
      if (action.payload.organizationUuid !== activeOrganizationUuid) {
        return state;
      }
      const newPrinters = action.payload.data.items.map((newPrinter) => {
        origPrinter = printers.find((p) => p.uuid === newPrinter.uuid);
        if (origPrinter) {
          return Object.assign({}, origPrinter, newPrinter);
        } else {
          return newPrinter;
        }
      });
      return Object.assign({}, state, {
        printers: getSortedPrinters(newPrinters).filter(
          (p) => state.toBeDeleted.indexOf(p.uuid) === -1
        ),
        printersLoaded: true,
      });
    case "PRINTERS_LOAD_DETAIL_SUCCEEDED":
      if (action.payload.organizationUuid !== activeOrganizationUuid) {
        return state;
      }
      newPrinter = action.payload.data;
      origPrinterIndex = printers.findIndex((p) => p.uuid === newPrinter.uuid);
      if (origPrinterIndex === -1) {
        printers.push(newPrinter);
      } else {
        printers[origPrinterIndex] = Object.assign(
          {},
          printers[origPrinterIndex],
          newPrinter
        );
      }
      return Object.assign({}, state, {
        printers: getSortedPrinters(printers),
      });
    case "PRINTERS_PATCH_SUCCEEDED":
      if (action.payload.organizationUuid !== activeOrganizationUuid) {
        return state;
      }
      newPrinter = action.payload.data;
      origPrinterIndex = printers.findIndex((p) => p.uuid === newPrinter.uuid);
      if (origPrinterIndex === -1) {
        printers.push(newPrinter);
      } else {
        printers[origPrinterIndex] = Object.assign(
          {},
          printers[origPrinterIndex],
          newPrinter
        );
      }
      return Object.assign({}, state, {
        printers: getSortedPrinters(printers),
      });
    case "PRINTERS_CHANGE_JOB_SUCCEEDED":
      origPrinterIndex = printers.findIndex(
        (p) => p.uuid === action.payload.uuid
      );
      if (origPrinterIndex === -1) {
        return state;
      }
      printers[origPrinterIndex] = Object.assign(
        {},
        printers[origPrinterIndex],
        {
          status: Object.assign({}, printers[origPrinterIndex].status, {
            state: statesMapping[action.payload.action] || "Unknown",
          }),
        }
      );
      return Object.assign({}, state, {
        printers: getSortedPrinters(printers),
      });
    case "PRINTERS_SET_CONNECTION_SUCCEEDED":
      origPrinterIndex = printers.findIndex(
        (p) => p.uuid === action.payload.uuid
      );
      if (origPrinterIndex === -1) {
        return state;
      }
      printers[origPrinterIndex] = Object.assign(
        {},
        printers[origPrinterIndex],
        {
          status: Object.assign({}, printers[origPrinterIndex].status, {
            state: statesMapping[action.payload.state] || "Unknown",
          }),
        }
      );
      return Object.assign({}, state, {
        printers: getSortedPrinters(printers),
      });
    case "PRINTERS_ADD_SUCCEEDED":
      printers.push(action.payload.data);
      return Object.assign({}, state, {
        printers: getSortedPrinters(printers),
      });
    case "PRINTERS_DELETE_STARTED":
      return Object.assign({}, state, {
        toBeDeleted: state.toBeDeleted.concat(action.payload),
      });
    case "PRINTERS_DELETE_SUCCEEDED":
      return Object.assign({}, state, {
        printers: printers.filter((p) => {
          return p.uuid !== action.payload.uuid;
        }),
        toBeDeleted: state.toBeDeleted.filter((d) => d !== action.payload.uuid),
      });
    case "PRINTERS_CHANGE_LIGHTS_SUCCEEDED":
      origPrinterIndex = printers.findIndex(
        (p) => p.uuid === action.payload.uuid
      );
      if (origPrinterIndex === -1) {
        return state;
      }
      printers[origPrinterIndex] = Object.assign(
        {},
        printers[origPrinterIndex],
        {
          lights: action.payload.data.status,
        }
      );
      return Object.assign({}, state, {
        printers: getSortedPrinters(printers),
      });
    case "USER_CLEAR_ENDED":
      for (let job in checkQueue) {
        clearInterval(job);
      }
      return Object.assign({}, initialState);
    case "USER_SWITCH_ORGANIZATION":
      for (let job in checkQueue) {
        clearInterval(job);
      }
      return Object.assign({}, initialState, {
        activeOrganizationUuid: action.payload.data.uuid,
      });
    default:
      return state;
  }
};
