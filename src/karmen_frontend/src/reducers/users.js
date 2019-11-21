export default (state = {
  currentState: 'unknown',
  username: '',
  identity: null,
  role: null,
  apiTokens: [],
  apiTokensLoaded: false,
}, action) => {
  const { apiTokens } = state;
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
    case "USER_CLEAR":
      return Object.assign({}, state, {
        currentState: "logged-out",
        identity: null,
        username: '',
        role: null,
      });
    case "USER_LOAD_API_TOKENS_SUCCEEDED":
      return Object.assign({}, state, {
        apiTokens: action.payload.data.items,
        apiTokensLoaded: true,
      });
    case "USER_ADD_API_TOKEN_SUCCEEDED":
      apiTokens.push({
        jti: action.payload.data.jti,
        name:action.payload.data.name,
        created: action.payload.data.created,
      })
      return Object.assign({}, state, {
        apiTokens: [].concat(apiTokens),
      });
    case "USER_DELETE_API_TOKEN_SUCCEEDED":
      return Object.assign({}, state, {
        apiTokens: apiTokens.filter((t) => {
          return t.jti !== action.payload.jti;
        }),
      });
    case "USER_SET_CURRENT_STATE":
      return Object.assign({}, state, {
        currentState: action.payload.currentState,
      });
    default:
      return state;
  }
}