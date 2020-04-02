const getSortedOrganizations = organizations => {
  return [].concat(organizations).sort((p, r) => {
    let result = -1;
    if (p.name.toLowerCase() > r.name.toLowerCase()) {
      result = 1;
    } else if (p.name.toLowerCase() === r.name.toLowerCase()) {
      result = p.uuid > r.uuid ? 1 : -1;
    }
    return result;
  });
};

export default (
  state = {
    list: [],
    listLoaded: false
  },
  action
) => {
  switch (action.type) {
    case "ORGANIZATIONS_LOAD_SUCCEEDED":
      return Object.assign({}, state, {
        list: getSortedOrganizations(action.payload.data.items),
        listLoaded: true
      });
    case "ORGANIZATIONS_EDIT_SUCCEEDED":
      const organizationIndex = state.list.findIndex(
        o => o.uuid === action.payload.data.uuid
      );
      if (organizationIndex > -1) {
        state.list[organizationIndex].name = action.payload.data.name;
      }
      return Object.assign({}, state, {
        list: getSortedOrganizations(state.list)
      });
    case "ORGANIZATIONS_ADD_SUCCEEDED":
      state.list.push({ role: "admin", ...action.payload.data });
      return Object.assign({}, state, {
        list: getSortedOrganizations(state.list)
      });
    case "USER_SWITCH_ORGANIZATION":
      return Object.assign({}, state, {
        list: [],
        listLoaded: false
      });
    case "ORGANIZATIONS_CLEAR":
      return Object.assign({}, state, {
        list: [],
        listLoaded: false
      });
    default:
      return state;
  }
};
