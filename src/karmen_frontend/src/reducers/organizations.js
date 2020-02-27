export default (
  state = {
    list: [],
    listLoaded: false
  },
  action
) => {
  switch (action.type) {
    case "ORGANIZATIONS_LOAD_SUCCEEDED":
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
    case "ORGANIZATIONS_EDIT_SUCCEEDED":
      if (action.payload.data) {
        const organizationIndex = state.list.findIndex(
          o => o.uuid === action.payload.data.uuid
        );
        if (organizationIndex > -1) {
          state.list[organizationIndex].name = action.payload.data.name;
        }
      }
      return Object.assign({}, state, {
        list: [].concat(state.list)
      });
    case "USER_SWITCH_ORGANIZATION":
      return Object.assign({}, state, {
        list: []
      });
    case "ORGANIZATIONS_CLEAR":
      return Object.assign({}, state, {
        list: []
      });
    default:
      return state;
  }
};
