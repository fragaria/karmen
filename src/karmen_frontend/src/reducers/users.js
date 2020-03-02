import dayjs from "dayjs";
import { persistUserProfile, dropUserProfile } from "../services/backend";

const getUserDataFromApiResponse = (data, activeOrganization) => {
  return {
    currentState: data.force_pwd_change ? "pwd-change-required" : "logged-in",
    identity: data.identity,
    username: data.username,
    email: data.email,
    systemRole: data.system_role,
    hasFreshToken: data.fresh,
    accessTokenExpiresOn: data.expires_on ? dayjs(data.expires_on) : undefined,
    organizations: data.organizations,
    activeOrganization: activeOrganization
  };
};

const _without = (key, { [key]: _, ...obj }) => obj;

export default (
  state = {
    me: {
      hasFreshToken: false,
      currentState: "logged-out",
      username: "",
      email: "",
      identity: null,
      systemRole: null,
      apiTokens: [],
      apiTokensLoaded: false,
      accessTokenExpiresOn: null,
      organizations: {},
      activeOrganization: null
    },
    list: [],
    listLoaded: false
  },
  action
) => {
  let userData;
  const { me } = state;
  switch (action.type) {
    case "USER_DATA_LOADED":
      userData = getUserDataFromApiResponse(action.payload.data);
      persistUserProfile(_without("activeOrganization", userData));
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
      userData = getUserDataFromApiResponse(
        action.payload.data,
        state.me.activeOrganization
      );
      persistUserProfile(_without("activeOrganization", userData));
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
      userData = getUserDataFromApiResponse(
        action.payload.data,
        state.me.activeOrganization
      );
      persistUserProfile(_without("activeOrganization", userData));
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
      userData = getUserDataFromApiResponse(
        action.payload.data,
        state.me.activeOrganization
      );
      persistUserProfile(userData);
      return Object.assign({}, state, {
        me: Object.assign({}, state.me, userData)
      });
    case "USER_PATCH_SUCCEEDED":
      if (action.payload.status !== 200) {
        return state;
      }
      userData = Object.assign({}, state.me, {
        username: action.payload.data.username,
        email: action.payload.data.email
      });
      persistUserProfile(userData);
      return Object.assign({}, state, {
        me: Object.assign({}, state.me, userData)
      });
    case "USER_CHANGE_PASSWORD_SUCCEEDED":
      if (action.payload.status !== 200) {
        return state;
      }
      userData = getUserDataFromApiResponse(
        action.payload.data,
        state.me.activeOrganization
      );
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
          email: "",
          systemRole: null,
          apiTokens: [],
          apiTokensLoaded: false,
          organizations: {},
          activeOrganization: null
        }
      });
    case "USER_SWITCH_ORGANIZATION":
      if (action.payload.data && state.me.organizations) {
        const newActiveOrganization =
          state.me.organizations[action.payload.data.uuid];
        if (newActiveOrganization) {
          return Object.assign({}, state, {
            me: Object.assign({}, state.me, {
              activeOrganization: newActiveOrganization
            }),
            list: [],
            listLoaded: false
          });
        }
      }
      return state;
    case "USER_LOAD_API_TOKENS_SUCCEEDED":
      return Object.assign({}, state, {
        me: Object.assign({}, state.me, {
          apiTokens: action.payload.data.items,
          apiTokensLoaded: true
        })
      });
    case "USER_ADD_API_TOKEN_SUCCEEDED":
      me.apiTokens.push(action.payload.data);
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
    case "USERS_LOAD_SUCCEEDED":
      if (action.payload.status !== 200) {
        return state;
      }
      if (!action.payload.data || !action.payload.data.items) {
        return state;
      }
      return Object.assign({}, state, {
        list: [].concat(action.payload.data.items),
        listLoaded: true
      });
    case "USERS_ADD_SUCCEEDED":
      return Object.assign({}, state, {
        list: [].concat(state.list).concat([action.payload.data]),
        listLoaded: true
      });
    case "USERS_EDIT_SUCCEEDED":
      if (action.payload.data) {
        const userIndex = state.list.findIndex(
          u => u.uuid === action.payload.data.uuid
        );
        if (userIndex > -1) {
          state.list[userIndex].role = action.payload.data.role;
        }
      }
      return Object.assign({}, state, {
        list: [].concat(state.list)
      });
    case "USERS_DELETE_SUCCEEDED":
      if (action.payload.data) {
        const userIndex = state.list.findIndex(
          u => u.uuid === action.payload.data.uuid
        );
        if (userIndex > -1) {
          state.list = state.list
            .slice(0, userIndex)
            .concat(state.list.slice(userIndex + 1));
        }
      }
      return Object.assign({}, state, {
        list: [].concat(state.list)
      });
    case "ORGANIZATIONS_ADD_SUCCEEDED":
      if (action.payload && action.payload.data && action.payload.data.uuid) {
        return Object.assign({}, state, {
          me: Object.assign({}, state.me, {
            organizations: Object.assign({}, state.me.organizations, {
              [action.payload.data.uuid]: {
                ...action.payload.data,
                role: "admin"
              }
            })
          })
        });
      }
      return state;
    case "ORGANIZATIONS_EDIT_SUCCEEDED":
      let newOrganizations = Object.assign({}, state.me.organizations);
      const existing = Object.values(state.me.organizations).find(
        o => o.uuid === action.payload.data.uuid
      );
      if (existing) {
        newOrganizations[action.payload.data.uuid] = Object.assign(
          {},
          state.me.organizations[existing.uuid],
          action.payload.data
        );
        delete newOrganizations[existing.uuid];
      }
      let newActiveOrganization = state.me.activeOrganization;
      if (state.me.activeOrganization.uuid === action.payload.data.uuid) {
        newActiveOrganization = Object.assign(
          {},
          state.me.activeOrganization,
          action.payload.data
        );
      }
      return Object.assign({}, state, {
        me: Object.assign({}, state.me, {
          organizations: newOrganizations,
          activeOrganization: newActiveOrganization
        })
      });
    case "USERS_CLEAR":
      return Object.assign({}, state, {
        list: []
      });
    default:
      return state;
  }
};
