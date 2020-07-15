const initialState = {
  isOnline: true,
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
      /* This action is fired every few seconds. It forced dialogs
       * (DeleteModal) to re-render. Let's return changed state if and only if
       * it really changed. I was not able to achive the same effect by
       * shouldComponentUpdate() */
      if (
        state.isOnline === true &&
        state.apiVersion === apiVersion &&
        state.shouldUpgrade === shouldUpgrade
      ) {
        // nothing to do here
        return state;
      } else {
        // update the state
        return Object.assign({}, state, {
          isOnline: true,
          apiVersion: apiVersion,
          shouldUpgrade: shouldUpgrade,
        });
      }
    case "HEARTBEAT_FAILED":
      return Object.assign({}, state, {
        isOnline: false,
      });
    default:
      return state;
  }
};
