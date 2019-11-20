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
        hasFreshToken: action.payload.user.hasFreshToken,
      });
    case "USER_SET_TOKEN_FRESHNESS_SUCCEEDED":
      return Object.assign({}, state, {
        hasFreshToken: action.payload.isFresh,
      });
    case "USER_CLEAR_SUCCEEDED":
      return Object.assign({}, state, {
        currentState: "logged-out",
        identity: null,
        username: null,
        role: null,
      });
//    case "USER_LOAD_API_TOKENS_SUCCEEDED": // TODO
//      return Object.assign({}, state, {
//      });
    case "USER_SET_CURRENT_STATE":
      return Object.assign({}, state, {
        currentState: action.payload.currentState,
      });
    default:
      return state;
  }
}