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
  action
) => {
  let userData;
  const { apiTokens } = state;
  switch (action.type) {
    case "USER_DATA_LOADED":
      userData = getUserDataFromApiResponse(action.payload.data);
      persistUserProfile(_without("activeOrganization", userData));
      return Object.assign({}, state, {
        ...userData,
        apiTokens: [],
        apiTokensLoaded: false
      });
    case "USER_AUTHENTICATE_FRESH_SUCCEEDED":
      userData = getUserDataFromApiResponse(
        action.payload.data,
        state.activeOrganization
      );
      persistUserProfile(_without("activeOrganization", userData));
      return Object.assign({}, state, {
        ...userData,
        apiTokens: [],
        apiTokensLoaded: false
      });
    case "USER_AUTHENTICATE_SUCCEEDED":
      userData = getUserDataFromApiResponse(
        action.payload.data,
        state.activeOrganization
      );
      persistUserProfile(_without("activeOrganization", userData));
      return Object.assign({}, state, {
        ...userData,
        apiTokens: [],
        apiTokensLoaded: false
      });
    case "USER_REFRESH_ACCESS_TOKEN_SUCCEEDED":
      userData = getUserDataFromApiResponse(
        action.payload.data,
        state.activeOrganization
      );
      persistUserProfile(userData);
      return Object.assign({}, state, userData);
    case "USER_PATCH_SUCCEEDED":
      userData = Object.assign({}, state, {
        username: action.payload.data.username,
        email: action.payload.data.email
      });
      persistUserProfile(userData);
      return Object.assign({}, state, userData);
    case "USER_CHANGE_PASSWORD_SUCCEEDED":
      userData = getUserDataFromApiResponse(
        action.payload.data,
        state.activeOrganization
      );
      persistUserProfile(userData);
      return Object.assign({}, state, userData);
    case "USER_CLEAR_ENDED":
      dropUserProfile();
      return Object.assign({}, state, {
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
      });
    case "USER_SWITCH_ORGANIZATION":
      if (action.payload.data && state.organizations) {
        const newActiveOrganization =
          state.organizations[action.payload.data.uuid];
        if (newActiveOrganization) {
          return Object.assign({}, state, {
            activeOrganization: newActiveOrganization
          });
        }
      }
      return state;
    case "USER_LOAD_API_TOKENS_SUCCEEDED":
      return Object.assign({}, state, {
        apiTokens: action.payload.data.items,
        apiTokensLoaded: true
      });
    case "USER_ADD_API_TOKEN_SUCCEEDED":
      apiTokens.push(action.payload.data);
      return Object.assign({}, state, {
        apiTokens: [].concat(apiTokens)
      });
    case "USER_DELETE_API_TOKEN_SUCCEEDED":
      return Object.assign({}, state, {
        apiTokens: apiTokens.filter(t => {
          return t.jti !== action.payload.jti;
        })
      });
    case "ORGANIZATIONS_ADD_SUCCEEDED":
      if (action.payload && action.payload.data && action.payload.data.uuid) {
        return Object.assign({}, state, {
          organizations: Object.assign({}, state.organizations, {
            [action.payload.data.uuid]: {
              ...action.payload.data,
              role: "admin"
            }
          })
        });
      }
      return state;
    case "ORGANIZATIONS_EDIT_SUCCEEDED":
      let newOrganizations = Object.assign({}, state.organizations);
      const existing = Object.values(state.organizations).find(
        o => o.uuid === action.payload.data.uuid
      );
      if (existing) {
        newOrganizations[action.payload.data.uuid] = Object.assign(
          {},
          state.organizations[existing.uuid],
          action.payload.data
        );
      }
      let newActiveOrganization = state.activeOrganization;
      if (state.activeOrganization.uuid === action.payload.data.uuid) {
        newActiveOrganization = Object.assign(
          {},
          state.activeOrganization,
          action.payload.data
        );
      }
      return Object.assign({}, state, {
        organizations: newOrganizations,
        activeOrganization: newActiveOrganization
      });
    default:
      return state;
  }
};
