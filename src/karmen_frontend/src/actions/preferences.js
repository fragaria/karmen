export const setPrinterViewType = viewType => dispatch => {
  return dispatch({
    type: "SET_PRINTER_VIEW",
    payload: {
      viewType
    }
  });
};

export const setNetworkInterface = networkInterface => dispatch => {
  return dispatch({
    type: "SET_NETWORK_INTERFACE",
    payload: {
      networkInterface
    }
  });
};
