export default (state = {
  currentState: 'unknown',
}, action) => {
  switch (action.type) {
    case "USER_LOAD_STATE_SUCCEEDED":
      return Object.assign({}, state, {
        currentState: action.payload.state,
        identity: action.payload.identity,
      });
    default:
      return state;
  }
}