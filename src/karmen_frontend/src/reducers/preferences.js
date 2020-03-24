import {
  getUserPreferences,
  dropUserPreferences,
  persistUserPreferences
} from "../services/backend";

const defaults = {
  printerViewType: "list",
  networkInterface: "wlan0"
};

export default (
  state = {
    activeOrganizationUuid: null,
    identity: null,
    orgs: {}
  },
  action
) => {
  const { activeOrganizationUuid } = state;
  let settings, newOrgs;
  switch (action.type) {
    case "USER_AUTHENTICATE_SUCCEEDED":
      settings = getUserPreferences();
      if (!settings || settings.identity !== action.payload.data.identity) {
        persistUserPreferences({
          activeOrganizationUuid: null,
          identity: state.identity,
          orgs: {}
        });
        return Object.assign({}, state, {
          identity: action.payload.data.identity
        });
      } else {
        return Object.assign({}, state, {
          identity: action.payload.data.identity,
          orgs: settings.orgs
        });
      }
    case "USER_DATA_LOADED":
      settings = getUserPreferences();
      if (!settings || settings.identity !== action.payload.data.identity) {
        persistUserPreferences({
          activeOrganizationUuid: null,
          identity: state.identity,
          orgs: {}
        });
        return Object.assign({}, state, {
          identity: action.payload.data.identity
        });
      } else {
        return Object.assign({}, state, {
          identity: action.payload.data.identity,
          orgs: settings.orgs
        });
      }
    case "SET_PRINTER_VIEW":
      newOrgs = Object.assign({}, state.orgs, {
        [activeOrganizationUuid]: Object.assign(
          {},
          defaults,
          state.orgs[activeOrganizationUuid],
          {
            printerViewType: action.payload.viewType
          }
        )
      });
      persistUserPreferences({
        activeOrganizationUuid: state.activeOrganizationUuid,
        identity: state.identity,
        orgs: newOrgs
      });
      return Object.assign({}, state, {
        orgs: newOrgs
      });
    case "SET_NETWORK_INTERFACE":
      newOrgs = Object.assign({}, state.orgs, {
        [activeOrganizationUuid]: Object.assign(
          {},
          defaults,
          state.orgs[activeOrganizationUuid],
          {
            networkInterface: action.payload.networkInterface
          }
        )
      });
      persistUserPreferences({
        activeOrganizationUuid: state.activeOrganizationUuid,
        identity: state.identity,
        orgs: state.orgs
      });
      return Object.assign({}, state, {
        orgs: newOrgs
      });
    case "USER_CLEAR_ENDED":
      dropUserPreferences();
      return Object.assign({}, state, {
        activeOrganizationUuid: null,
        identity: null,
        orgs: {}
      });
    case "USER_SWITCH_ORGANIZATION":
      persistUserPreferences({
        activeOrganizationUuid: action.payload.data.uuid,
        identity: state.identity,
        orgs: state.orgs
      });
      return Object.assign({}, state, {
        activeOrganizationUuid: action.payload.data.uuid
      });
    default:
      return state;
  }
};
