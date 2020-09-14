import jwtdecode from "jwt-decode"

const getUserDataFromApiResponse = (data, activeOrganization) => {
console.log("getuserdata", data)
console.log("getuserdata", activeOrganization)
  let prof =  {
    currentState:
      data.currentState ||
      (data.force_pwd_change ? "pwd-change-required" : "logged-in"),
    user: data.user,
    groups: data.groups,
    identity: data.id,
    username: data.username,
    email: data.email,
    systemRole: data.system_role || data.systemRole,
    accessTokenExpiresOn: data.accessTokenExpiresOn,
    organizations: data.groups,
    activeOrganization: data.activeOrganization || activeOrganization,
  };
  if (data.access) {
    let decoded_token = jwtdecode(data.access);
    prof.accessTokenExpiresOn = decoded_token.exp ? new Date(decoded_token.exp * 1000) : undefined;
  }
  return prof;
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
    activeOrganization: null,
  },
  action
) => {
  let userData;
  const { apiTokens } = state;
  switch (action.type) {
    case "USER_DATA_LOADED":
      userData = getUserDataFromApiResponse(action.payload.data);
      return Object.assign({}, state, {
        ...userData,
        apiTokens: [],
        apiTokensLoaded: false,
      });
    case "USER_AUTHENTICATE_FRESH_SUCCEEDED":
      userData = getUserDataFromApiResponse(
        action.payload.data,
        state.activeOrganization
      );
      return Object.assign({}, state, {
        ...userData,
        apiTokens: [],
        apiTokensLoaded: false,
      });
    case "USER_AUTHENTICATE_SUCCEEDED":
      userData = getUserDataFromApiResponse(
        action.payload.data,
        state.activeOrganization
      );
      return Object.assign({}, state, {
        ...userData,
        apiTokens: [],
        apiTokensLoaded: false,
      });
    case "USER_REFRESH_ACCESS_TOKEN_SUCCEEDED":
      console.log("refresh token succeeded", action.payload)
      localStorage.setItem("karmen_access_token", action.payload.data.access);
      return Object.assign({}, state);
    case "USER_PATCH_SUCCEEDED":
      userData = Object.assign({}, state, {
        username: action.payload.data.username,
        email: action.payload.data.email,
      });
      return Object.assign({}, state, userData);
    case "USER_CHANGE_PASSWORD_SUCCEEDED":
      userData = getUserDataFromApiResponse(
        action.payload.data,
        state.activeOrganization
      );
      return Object.assign({}, state, userData);
    case "USER_CLEAR_ENDED":
          localStorage.removeItem("karmen_access_token");
          localStorage.removeItem("karmen_refresh_token");
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
        activeOrganization: null,
      });
    case "USER_SWITCH_ORGANIZATION":
      if (action.payload.data && state.organizations) {
        const newActiveOrganization =
          state.organizations[action.payload.data.id];
        if (newActiveOrganization) {
          return Object.assign({}, state, {
            activeOrganization: newActiveOrganization,
          });
        }
      }
      return state;
    case "USER_LOAD_API_TOKENS_SUCCEEDED":
      return Object.assign({}, state, {
        apiTokens: action.payload.data.items,
        apiTokensLoaded: true,
      });
    case "USER_ADD_API_TOKEN_SUCCEEDED":
      apiTokens.push(action.payload.data);
      return Object.assign({}, state, {
        apiTokens: [].concat(apiTokens),
      });
    case "USER_DELETE_API_TOKEN_SUCCEEDED":
      return Object.assign({}, state, {
        apiTokens: apiTokens.filter((t) => {
          return t.jti !== action.payload.jti;
        }),
      });
    case "ORGANIZATIONS_ADD_SUCCEEDED":
      if (action.payload && action.payload.data && action.payload.data.id) {
        return Object.assign({}, state, {
          organizations: Object.assign({}, state.organizations, {
            [action.payload.data.id]: {
              ...action.payload.data,
              role: "admin",
            },
          }),
        });
      }
      return state;
    case "ORGANIZATIONS_EDIT_SUCCEEDED":
      let newOrganizations = Object.assign({}, state.organizations);
      const existing = Object.values(state.organizations).find(
        (o) => o.id === action.payload.data.id
      );
      if (existing) {
        newOrganizations[action.payload.data.id] = Object.assign(
          {},
          state.organizations[existing.id],
          action.payload.data
        );
      }
      let newActiveOrganization = state.activeOrganization;
      if (state.activeOrganization.id === action.payload.data.id) {
        newActiveOrganization = Object.assign(
          {},
          state.activeOrganization,
          action.payload.data
        );
      }
      return Object.assign({}, state, {
        organizations: newOrganizations,
        activeOrganization: newActiveOrganization,
      });
    default:
      return state;
  }
};
