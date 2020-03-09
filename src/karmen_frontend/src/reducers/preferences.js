const defaults = {
  printerViewType: "list",
  networkInterface: "wlan0"
};

export default (
  state = {
    activeOrganizationUuid: null,
    orgs: {}
  },
  action
) => {
  const { activeOrganizationUuid } = state;
  switch (action.type) {
    // TODO persist user preferences in local storage
    case "SET_PRINTER_VIEW":
      return Object.assign({}, state, {
        orgs: Object.assign({}, state.orgs, {
          [activeOrganizationUuid]: Object.assign(
            {},
            defaults,
            state.orgs[activeOrganizationUuid],
            {
              printerViewType: action.payload.viewType
            }
          )
        })
      });
    case "SET_NETWORK_INTERFACE":
      return Object.assign({}, state, {
        orgs: Object.assign({}, state.orgs, {
          [activeOrganizationUuid]: Object.assign(
            {},
            defaults,
            state.orgs[activeOrganizationUuid],
            {
              networkInterface: action.payload.networkInterface
            }
          )
        })
      });
    case "USER_SWITCH_ORGANIZATION":
      return Object.assign({}, state, {
        activeOrganizationUuid: action.payload.data.uuid
      });
    default:
      return state;
  }
};
