export default (state = {
  currentState: 'unknown',
}, action) => {
  switch (action.type) {
    case "USER_LOAD_STATE_SUCCEEDED":
      return Object.assign({}, state, {
        currentState: action.payload.state,
        identity: action.payload.user.identity,
        username: action.payload.user.username,
        role: action.payload.user.role,
      });
    case "USER_CLEAR_SUCCEEDED":
      return Object.assign({}, state, {
        currentState: "logged-out",
        identity: null,
        username: null,
        role: null,
      });
    default:
      return state;
  }
}