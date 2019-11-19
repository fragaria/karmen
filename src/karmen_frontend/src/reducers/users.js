export default (state = {
  currentState: 'unknown',
}, action) => {
  switch (action.type) {
    case "LOAD_USER_STATE_SUCCEEDED":
      return Object.assign({}, state, {
        currentState: action.payload
      });
    default:
      return state;
  }
}