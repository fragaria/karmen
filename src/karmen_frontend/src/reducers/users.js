import jwt_decode from "jwt-decode";
import dayjs from "dayjs";
import { setAccessToken, setRefreshToken } from "../services/backend/utils";

const getUserDataFromToken = token => {
  const decoded = jwt_decode(token);
  return {
    currentState: decoded.user_claims.force_pwd_change
      ? "pwd-change-required"
      : "logged-in",
    identity: decoded.identity,
    username: decoded.user_claims && decoded.user_claims.username,
    role: decoded.user_claims && decoded.user_claims.role,
    hasFreshToken: decoded.fresh,
    accessTokenExpiresOn: dayjs(decoded.exp * 1000)
  };
};

export default (
  state = {
    me: {
      accessToken: null,
      refreshToken: null,
      hasFreshToken: false,
      currentState: "logged-out",
      username: "",
      identity: null,
      role: null,
      apiTokens: [],
      apiTokensLoaded: false,
      accessTokenExpiresOn: null
    },
    list: {
      pages: [],
      orderBy: "+username",
      filter: "",
      limit: 10
    }
  },
  action
) => {
  let userData;
  const { me } = state;
  switch (action.type) {
    case "USER_LOADED_FROM_STORAGE":
      userData = getUserDataFromToken(action.payload.access_token);
      setAccessToken(action.payload.access_token);
      return Object.assign({}, state, {
        me: {
          ...userData,
          accessToken: action.payload.access_token,
          refreshToken: action.payload.refresh_token,
          apiTokens: [],
          apiTokensLoaded: false
        }
      });
    case "USER_AUTHENTICATE_SUCCEEDED":
      if (action.payload.status !== 200) {
        return state;
      }
      userData = getUserDataFromToken(action.payload.data.access_token);
      action.payload.data.access_token &&
        setAccessToken(action.payload.data.access_token);
      action.payload.data.refresh_token &&
        setRefreshToken(action.payload.data.refresh_token);
      return Object.assign({}, state, {
        me: {
          ...userData,
          accessToken: action.payload.data.access_token,
          refreshToken: action.payload.data.refresh_token,
          apiTokens: [],
          apiTokensLoaded: false
        }
      });
    case "USER_REFRESH_ACCESS_TOKEN_SUCCEEDED":
      if (action.payload.status !== 200) {
        return state;
      }
      userData = getUserDataFromToken(action.payload.data.access_token);
      setAccessToken(action.payload.data.access_token);
      return Object.assign({}, state, {
        me: Object.assign({}, state.me, {
          ...userData,
          accessToken: action.payload.data.access_token
        })
      });
    case "USER_CHANGE_PASSWORD_SUCCEEDED":
      if (action.payload.status !== 200) {
        return state;
      }
      userData = getUserDataFromToken(action.payload.data.access_token);
      setAccessToken(action.payload.data.access_token);
      return Object.assign({}, state, {
        me: Object.assign({}, state.me, {
          ...userData,
          accessToken: action.payload.data.access_token
        })
      });
    case "USER_CLEAR":
      setRefreshToken(null);
      setAccessToken(null);
      return Object.assign({}, state, {
        me: {
          currentState: "logged-out",
          accessToken: null,
          refreshToken: null,
          hasFreshToken: false,
          accessTokenExpiresOn: null,
          identity: null,
          username: "",
          role: null,
          apiTokens: [],
          apiTokensLoaded: false
        }
      });
    case "USER_LOAD_API_TOKENS_SUCCEEDED":
      return Object.assign({}, state, {
        me: Object.assign({}, state.me, {
          apiTokens: action.payload.data.items,
          apiTokensLoaded: true
        })
      });
    case "USER_ADD_API_TOKEN_SUCCEEDED":
      me.apiTokens.push({
        jti: action.payload.data.jti,
        name: action.payload.data.name,
        created: action.payload.data.created
      });
      return Object.assign({}, state, {
        me: Object.assign({}, state.me, {
          apiTokens: [].concat(me.apiTokens)
        })
      });
    case "USER_DELETE_API_TOKEN_SUCCEEDED":
      return Object.assign({}, state, {
        me: Object.assign({}, state.me, {
          apiTokens: me.apiTokens.filter(t => {
            return t.jti !== action.payload.jti;
          })
        })
      });
    case "USERS_LOAD_PAGE_SUCCEEDED":
      if (action.payload.status !== 200) {
        return state;
      }
      let currentPages = state.list.pages;
      // continue only with the same conditions
      if (
        state.list.filter === action.payload.filter &&
        state.list.orderBy === action.payload.orderBy &&
        state.list.limit === action.payload.limit
      ) {
        // TODO possibly switch to findIndex
        const origPage = currentPages.find(
          p => p.startWith === action.payload.startWith
        );
        if (!origPage && action.payload.data) {
          currentPages.push({
            data: action.payload.data,
            startWith: action.payload.startWith
          });
        }
        if (origPage && action.payload.data) {
          const origIndex = currentPages.indexOf(origPage);
          currentPages[origIndex] = {
            data: action.payload.data,
            startWith: action.payload.startWith
          };
        }
        // if any option changes, reset pages
      } else {
        currentPages = [
          {
            data: action.payload.data,
            startWith: action.payload.startWith
          }
        ];
      }
      return Object.assign({}, state, {
        list: Object.assign({}, state.list, {
          pages: [].concat(currentPages),
          orderBy: action.payload.orderBy,
          filter: action.payload.filter,
          limit: action.payload.limit
        })
      });
    case "USERS_EDIT_SUCCEEDED":
      const pages = state.list.pages;
      if (action.payload.data) {
        // eslint-disable-next-line no-unused-vars
        for (let page of pages) {
          if (page.data && page.data.items) {
            const user = page.data.items.find(
              u => u.uuid === action.payload.data.uuid
            );
            if (user) {
              user.suspended = action.payload.data.suspended;
              user.role = action.payload.data.role;
            }
          }
        }
      }
      return Object.assign({}, state, {
        list: Object.assign({}, state.list, {
          pages: [].concat(pages)
        })
      });
    case "USERS_CLEAR_PAGES":
      return Object.assign({}, state, {
        list: {
          pages: [],
          orderBy: "+username",
          filter: "",
          limit: 10
        }
      });
    default:
      return state;
  }
};
