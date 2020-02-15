export default (
  state = {
    printerViewType: "list"
  },
  action
) => {
  switch (action.type) {
    case "SET_PRINTER_VIEW":
      return Object.assign({}, state, {
        printerViewType: action.payload.viewType
      });
    default:
      return state;
  }
};
