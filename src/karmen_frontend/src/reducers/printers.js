export default (state = {
  printersLoaded: false,
  printers: [],
}, action) => {
  const { printers } = state;
  switch (action.type) {
    case "PRINTERS_LOAD_SUCCEEDED":
      return Object.assign({}, state, {
        printers: action.payload.data.items.sort((p, r) => p.name > r.name ? 1 : -1),
        printersLoaded: true,
      });
    case "PRINTERS_ADD_SUCCEEDED":
      printers.push(action.payload.data);
      return Object.assign({}, state, {
        printers: printers.sort((p, r) => p.name > r.name ? 1 : -1),
      });
    case "PRINTERS_DELETE_SUCCEEDED":
      return Object.assign({}, state, {
        printers: printers.filter((p) => {
          return p.host !== action.payload.data.host;
        }),
      });
    default:
      return state
  }
}