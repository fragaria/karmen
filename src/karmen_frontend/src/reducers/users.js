export default (state = {
  me: {
    currentState: 'unknown',
    username: '',
    identity: null,
    role: null,
    apiTokens: [],
    apiTokensLoaded: false,
  },
  list: {
    pages: [],
    orderBy: 'username',
    usernameFilter: '',
    limit: 10,
  }
}, action) => {
  const { me } = state;
  switch (action.type) {
    case "USER_LOAD_STATE_SUCCEEDED":
      return Object.assign({}, state, {
        me: {
          currentState: action.payload.state,
          identity: action.payload.user.identity,
          username: action.payload.user.username,
          role: action.payload.user.role,
          hasFreshToken: action.payload.user.hasFreshToken,
          apiTokens: [],
          apiTokensLoaded: false,
        }
      });
    case "USER_SET_TOKEN_FRESHNESS_SUCCEEDED":
      return Object.assign({}, state, {
        me: Object.assign({}, state.me, {
          hasFreshToken: action.payload.isFresh,
        })
      });
    case "USER_CLEAR":
      return Object.assign({}, state, {
        me: {
          currentState: "logged-out",
          identity: null,
          username: '',
          role: null,
          apiTokens: [],
          apiTokensLoaded: false,
        }
      });
    case "USER_LOAD_API_TOKENS_SUCCEEDED":
      return Object.assign({}, state, {
        me: Object.assign({}, state.me, {
          apiTokens: action.payload.data.items,
          apiTokensLoaded: true,
        })
      });
    case "USER_ADD_API_TOKEN_SUCCEEDED":
      me.apiTokens.push({
        jti: action.payload.data.jti,
        name:action.payload.data.name,
        created: action.payload.data.created,
      })
      return Object.assign({}, state, {
        me: Object.assign({}, state.me, {
          apiTokens: [].concat(me.apiTokens),
        })
      });
    case "USER_DELETE_API_TOKEN_SUCCEEDED":
      return Object.assign({}, state, {
        me: Object.assign({}, state.me, {
          apiTokens: me.apiTokens.filter((t) => {
            return t.jti !== action.payload.jti;
          }),
        })
      });
    case "USER_SET_CURRENT_STATE":
      return Object.assign({}, state, {
        me: Object.assign({}, state.me, {
          currentState: action.payload.currentState,
        })
      });
    case "USERS_LOAD_PAGE_SUCCEEDED":
      if (action.payload.status !== 200) {
        return state;
      }
      let currentPages = state.list.pages;
      // continue only with the same conditions
      if (
        state.list.usernameFilter === action.payload.usernameFilter && 
        state.list.orderBy === action.payload.orderBy &&
        state.list.limit === action.payload.limit
      ) {
        const origPage = currentPages.find((p) => p.startWith === action.payload.startWith);
        if (!origPage && action.payload.data) {
          currentPages.push({
            data: action.payload.data,
            startWith: action.payload.startWith,
          });
        }
        if (origPage && action.payload.data) {
          const origIndex = currentPages.indexOf(origPage);
          currentPages[origIndex] = {
            data: action.payload.data,
            startWith: action.payload.startWith,
          };
        }
      // if any option changes, reset pages
      } else {
        currentPages = [{
          data: action.payload.data,
          startWith: action.payload.startWith,
        }]
      }
      return Object.assign({}, state, {
        list: Object.assign({}, state.list, {
          pages: [].concat(currentPages),
          orderBy: action.payload.orderBy,
          usernameFilter: action.payload.usernameFilter,
          limit: action.payload.limit,
        })
      });
    case "USERS_CLEAR_PAGES":
      return Object.assign({}, state, {
        list: {
          pages: [],
          orderBy: 'username',
          usernameFilter: '',
          limit: 15,
        }
      });
    default:
      return state;
  }
}