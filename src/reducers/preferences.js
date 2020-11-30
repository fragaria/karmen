import {
  getUserPreferences,
  dropUserPreferences,
  persistUserPreferences,
} from "../services/backend";

const defaults = {
  printerViewType: "list",
};

export default (
  state = {
    activeOrganizationId: null,
    identity: null,
    orgs: {},
  },
  action
) => {
  const { activeOrganizationId } = state;
  let settings, newOrgs;
  switch (action.type) {
    case "USER_AUTHENTICATE_SUCCEEDED":
      settings = getUserPreferences();
      localStorage.setItem("karmen_access_token", action.payload.data.access);
      localStorage.setItem("karmen_refresh_token", action.payload.data.refresh);
      if (!settings || settings.identity !== action.payload.data.identity) {
        persistUserPreferences({
          activeOrganizationId: null,
          identity: state.identity,
          orgs: {},
        });
        return Object.assign({}, state, {
          identity: action.payload.data.identity,
        });
      } else {
        return Object.assign({}, state, {
          identity: action.payload.data.identity,
          orgs: settings.orgs,
        });
      }
    case "USER_DATA_LOADED":
      settings = getUserPreferences();
      if (!settings || settings.identity !== action.payload.data.identity) {
        persistUserPreferences({
          activeOrganizationId: null,
          identity: state.identity,
          orgs: {},
        });
        return Object.assign({}, state, {
          identity: action.payload.data.identity,
        });
      } else {
        return Object.assign({}, state, {
          identity: action.payload.data.identity,
          orgs: settings.orgs,
        });
      }
    case "SET_PRINTER_VIEW":
      newOrgs = Object.assign({}, state.orgs, {
        [activeOrganizationId]: Object.assign(
          {},
          defaults,
          state.orgs[activeOrganizationId],
          {
            printerViewType: action.payload.viewType,
          }
        ),
      });
      persistUserPreferences({
        activeOrganizationId: state.activeOrganizationId,
        identity: state.identity,
        orgs: newOrgs,
      });
      return Object.assign({}, state, {
        orgs: newOrgs,
      });
    case "USER_CLEAR_ENDED":
      dropUserPreferences();
      return Object.assign({}, state, {
        activeOrganizationId: null,
        identity: null,
        orgs: {},
      });
    case "USER_SWITCH_ORGANIZATION":
      persistUserPreferences({
        activeOrganizationId: action.payload.data.id,
        identity: state.identity,
        orgs: state.orgs,
      });
      return Object.assign({}, state, {
        activeOrganizationId: action.payload.data.id,
      });
    default:
      return state;
  }
};
