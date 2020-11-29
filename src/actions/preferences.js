export const setPrinterViewType = (viewType) => (dispatch) => {
  return dispatch({
    type: "SET_PRINTER_VIEW",
    payload: {
      viewType,
    },
  });
};
