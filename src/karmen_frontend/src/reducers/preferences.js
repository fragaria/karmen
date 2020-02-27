export default (
  state = {
    printerViewType: "list",
    networkInterface: "wlan0"
  },
  action
) => {
  switch (action.type) {
    // TODO persist user preferences in local storage
    // TODO make preferences org-specific
    case "SET_PRINTER_VIEW":
      return Object.assign({}, state, {
        printerViewType: action.payload.viewType
      });
    case "SET_NETWORK_INTERFACE":
      return Object.assign({}, state, {
        networkInterface: action.payload.networkInterface
      });
    default:
      return state;
  }
};
