const initialState = {
  isOnline: true,
  isMaintenance: false,
  apiVersion: undefined,
  shouldUpgrade: false,
};

export default (state = initialState, action) => {
  switch (action.type) {
    case "HEARTBEAT_SUCCEEDED":
      const apiVersion = action.payload.data.version;
      const shouldUpgrade =
        // Backend version changed
        (apiVersion !== state.apiVersion && state.apiVersion !== undefined) ||
        // Frontend version changed
        ![apiVersion, "@dev", `v${apiVersion}`].includes(
          process.env.REACT_APP_GIT_REV
        );

      return Object.assign({}, state, {
        isOnline: true,
        isMaintenance: false,
        apiVersion,
        shouldUpgrade,
      });
    case "HEARTBEAT_FAILED":
      return Object.assign({}, state, {
        isOnline: false,
      });
    case "HEARTBEAT_MAINTENANCE":
      return Object.assign({}, state, {
        isMaintenance: true,
      });
    default:
      return state;
  }
};
