const getSortedPrinters = printers => {
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

export default (
  state = {
    printersLoaded: false,
    printers: [],
    toBeDeleted: [],
    checkQueue: {}
  },
  action
) => {
  const { printers } = state;
  let newPrinter, origPrinter;
  switch (action.type) {
    case "PRINTERS_POLL_INTERVAL_SET":
      return Object.assign({}, state, {
        checkQueue: Object.assign({}, state.checkQueue, {
          [action.payload.uuid]: action.payload.interval
        })
      });
    case "PRINTERS_LOAD_DETAIL_SUCCEEDED":
      newPrinter = action.payload.data;
      if (!newPrinter) {
        return state;
      }
      // TODO possibly switch to findIndex
      origPrinter = printers.find(p => p.uuid === newPrinter.uuid);
      if (!origPrinter && newPrinter) {
        printers.push(newPrinter);
      }
      if (origPrinter && newPrinter) {
        const origIndex = printers.indexOf(origPrinter);
        printers[origIndex] = Object.assign({}, origPrinter, newPrinter);
      }
      return Object.assign({}, state, {
        printers: getSortedPrinters(printers)
      });
    case "PRINTERS_PATCH_SUCCEEDED":
      newPrinter = action.payload.data;
      if (!newPrinter) {
        return state;
      }
      // TODO possibly switch to findIndex
      origPrinter = printers.find(p => p.uuid === newPrinter.uuid);
      if (!origPrinter && newPrinter) {
        printers.push(newPrinter);
      }
      if (origPrinter && newPrinter) {
        const origIndex = printers.indexOf(origPrinter);
        printers[origIndex] = Object.assign({}, origPrinter, newPrinter);
      }
      return Object.assign({}, state, {
        printers: getSortedPrinters(printers)
      });
    case "PRINTERS_CHANGE_JOB_SUCCEEDED":
      newPrinter = action.payload.data;
      if (!newPrinter) {
        return state;
      }
      // TODO possibly switch to findIndex
      origPrinter = printers.find(p => p.uuid === newPrinter.uuid);
      if (!origPrinter && newPrinter) {
        return state;
      }
      if (origPrinter && newPrinter) {
        const origIndex = printers.indexOf(origPrinter);
        const states = {
          pause: "Paused",
          resume: "Printing",
          cancel: "Cancelling",
          offline: "Offline",
          online: "Connecting"
        };
        printers[origIndex] = Object.assign({}, origPrinter, {
          status: Object.assign({}, origPrinter.status, {
            state: states[newPrinter.action] || "Unknown"
          })
        });
      }
      return Object.assign({}, state, {
        printers: getSortedPrinters(printers)
      });
    case "PRINTERS_SET_CONNECTION_SUCCEEDED":
      newPrinter = action.payload.data;
      if (!newPrinter) {
        return state;
      }
      // TODO possibly switch to findIndex
      origPrinter = printers.find(p => p.uuid === newPrinter.uuid);
      if (!origPrinter && newPrinter) {
        return state;
      }
      if (origPrinter && newPrinter) {
        const origIndex = printers.indexOf(origPrinter);
        const states = {
          pause: "Paused",
          resume: "Printing",
          cancel: "Cancelling",
          offline: "Offline",
          online: "Connecting"
        };
        printers[origIndex] = Object.assign({}, origPrinter, {
          status: Object.assign({}, origPrinter.status, {
            state: states[newPrinter.state] || "Unknown"
          })
        });
      }
      return Object.assign({}, state, {
        printers: getSortedPrinters(printers)
      });
    case "PRINTERS_LOAD_SUCCEEDED":
      if (!action.payload.data.items) {
        return Object.assign({}, state, {
          printers: [],
          printersLoaded: true
        });
      }
      const newPrinters = action.payload.data.items.map(newPrinter => {
        origPrinter = printers.find(p => p.uuid === newPrinter.uuid);
        if (origPrinter) {
          return Object.assign({}, origPrinter, newPrinter);
        } else {
          return newPrinter;
        }
      });
      return Object.assign({}, state, {
        printers: getSortedPrinters(newPrinters).filter(
          p => state.toBeDeleted.indexOf(p.uuid) === -1
        ),
        printersLoaded: true
      });
    case "PRINTERS_ADD_SUCCEEDED":
      printers.push(action.payload.data);
      return Object.assign({}, state, {
        printers: getSortedPrinters(printers)
      });
    case "PRINTERS_DELETE_STARTED":
      return Object.assign({}, state, {
        toBeDeleted: state.toBeDeleted.concat(action.payload)
      });
    case "PRINTERS_DELETE_SUCCEEDED":
      return Object.assign({}, state, {
        printers: printers.filter(p => {
          return p.uuid !== action.payload.data.uuid;
        }),
        toBeDeleted: state.toBeDeleted.filter(
          d => d !== action.payload.data.uuid
        )
      });
    default:
      return state;
  }
};
