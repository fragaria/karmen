import dayjs from "dayjs";
import { persistUserProfile, dropUserProfile } from "../services/backend";

const getUserDataFromApiResponse = data => {
  return {
    currentState: data.force_pwd_change ? "pwd-change-required" : "logged-in",
    identity: data.identity,
    username: data.username,
    systemRole: data.system_role,
    hasFreshToken: data.fresh,
    accessTokenExpiresOn: data.expires_on ? dayjs(data.expires_on) : undefined,
    organizations: data.organizations,
    activeOrganization:
      data.organizations && data.organizations[0] && data.organizations[0].uuid
  };
};

export default (
  state = {
    me: {
      hasFreshToken: false,
      currentState: "logged-out",
      username: "",
      identity: null,
      systemRole: null,
      apiTokens: [],
      apiTokensLoaded: false,
      accessTokenExpiresOn: null,
      organizations: {},
      activeOrganization: null
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
    case "USER_DATA_LOADED":
      userData = getUserDataFromApiResponse(action.payload.data);
      persistUserProfile(userData);
      return Object.assign({}, state, {
        me: {
          ...userData,
          apiTokens: [],
          apiTokensLoaded: false
        }
      });
    case "USER_AUTHENTICATE_FRESH_SUCCEEDED":
      if (action.payload.status !== 200) {
        return state;
      }
      userData = getUserDataFromApiResponse(action.payload.data);
      persistUserProfile(userData);
      return Object.assign({}, state, {
        me: {
          ...userData,
          apiTokens: [],
          apiTokensLoaded: false
        }
      });
    case "USER_AUTHENTICATE_SUCCEEDED":
      if (action.payload.status !== 200) {
        return state;
      }
      userData = getUserDataFromApiResponse(action.payload.data);
      persistUserProfile(userData);
      return Object.assign({}, state, {
        me: {
          ...userData,
          apiTokens: [],
          apiTokensLoaded: false
        }
      });
    case "USER_REFRESH_ACCESS_TOKEN_SUCCEEDED":
      if (action.payload.status !== 200) {
        return state;
      }
      userData = getUserDataFromApiResponse(action.payload.data);
      persistUserProfile(userData);
      return Object.assign({}, state, {
        me: Object.assign({}, state.me, userData)
      });
    case "USER_CHANGE_PASSWORD_SUCCEEDED":
      if (action.payload.status !== 200) {
        return state;
      }
      userData = getUserDataFromApiResponse(action.payload.data);
      persistUserProfile(userData);
      return Object.assign({}, state, {
        me: Object.assign({}, state.me, userData)
      });
    case "USER_CLEAR_ENDED":
      dropUserProfile();
      return Object.assign({}, state, {
        me: {
          currentState: "logged-out",
          hasFreshToken: false,
          accessTokenExpiresOn: null,
          identity: null,
          username: "",
          systemRole: null,
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
              user.systemRole = action.payload.data.system_role;
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
