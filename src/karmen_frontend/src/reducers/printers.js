export default (state = {
  printersLoaded: false,
  printers: [],
  toBeDeleted: [],
}, action) => {
  const { printers } = state;
  let newPrinter, origPrinter;
  switch (action.type) {
    case "PRINTERS_LOAD_DETAIL_SUCCEEDED":
      newPrinter = action.payload.data;
      // TODO possibly switch to findIndex
      origPrinter = printers.find((p) => p.host === newPrinter.host)
      if (!origPrinter && newPrinter) {
        printers.push(newPrinter);
      }
      if (origPrinter && newPrinter) {
        const origIndex = printers.indexOf(origPrinter);
        printers[origIndex] = newPrinter;
      }
      return Object.assign({}, state, {
        printers: [].concat(printers).sort((p, r) => p.name > r.name ? 1 : -1),
      });
    case "PRINTERS_PATCH_SUCCEEDED":
      newPrinter = action.payload.data;
      // TODO possibly switch to findIndex
      origPrinter = printers.find((p) => p.host === newPrinter.host)
      if (!origPrinter && newPrinter) {
        printers.push(newPrinter);
      }
      if (origPrinter && newPrinter) {
        const origIndex = printers.indexOf(origPrinter);
        printers[origIndex] = newPrinter;
      }
      return Object.assign({}, state, {
        printers: [].concat(printers).sort((p, r) => p.name > r.name ? 1 : -1),
      });
    case "PRINTERS_CHANGE_JOB_SUCCEEDED":
      newPrinter = action.payload.data;
      // TODO possibly switch to findIndex
      origPrinter = printers.find((p) => p.host === newPrinter.host)
      if (!origPrinter && newPrinter) {
        return state;
      }
      if (origPrinter && newPrinter) {
        const origIndex = printers.indexOf(origPrinter);
        const states = {
          "pause": "Paused",
          "resume": "Printing",
          "cancel": "Cancelling",
          "offline": "Offline",
          "online": "Connecting",
        }
        printers[origIndex] = Object.assign({}, origPrinter, {
          status: Object.assign({}, origPrinter.status, {
            state: states[newPrinter.action] || "Unknown",
          }),
        });
      }
      return Object.assign({}, state, {
        printers: [].concat(printers).sort((p, r) => p.name > r.name ? 1 : -1),
      });
    case "PRINTERS_SET_CONNECTION_SUCCEEDED":
      newPrinter = action.payload.data;
      // TODO possibly switch to findIndex
      origPrinter = printers.find((p) => p.host === newPrinter.host)
      if (!origPrinter && newPrinter) {
        return state;
      }
      if (origPrinter && newPrinter) {
        const origIndex = printers.indexOf(origPrinter);
        const states = {
          "pause": "Paused",
          "resume": "Printing",
          "cancel": "Cancelling",
          "offline": "Offline",
          "online": "Connecting",
        }
        printers[origIndex] = Object.assign({}, origPrinter, {
          status: Object.assign({}, origPrinter.status, {
            state: states[newPrinter.state] || "Unknown",
          }),
        });
      }
      return Object.assign({}, state, {
        printers: [].concat(printers).sort((p, r) => p.name > r.name ? 1 : -1),
      });
    case "PRINTERS_LOAD_SUCCEEDED":
      return Object.assign({}, state, {
        printers: action.payload.data.items
          ? action.payload.data.items
            .sort((p, r) => p.name > r.name ? 1 : -1)
            .filter((p) => state.toBeDeleted.indexOf(p.host) === -1)
          : [],
        printersLoaded: true,
      });
    case "PRINTERS_ADD_SUCCEEDED":
      printers.push(action.payload.data);
      return Object.assign({}, state, {
        printers: printers.sort((p, r) => p.name > r.name ? 1 : -1),
      });
    case "PRINTERS_DELETE_STARTED":
      return Object.assign({}, state, {
        toBeDeleted: state.toBeDeleted.concat(action.payload)
      });
    case "PRINTERS_DELETE_SUCCEEDED":
      return Object.assign({}, state, {
        printers: printers.filter((p) => {
          return p.host !== action.payload.data.host;
        }),
        toBeDeleted: state.toBeDeleted.filter((d) => d !== action.payload.data.host)
      });
    default:
      return state
  }
}