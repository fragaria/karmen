export default (
  state = {
    list: [],
    listLoaded: false
  },
  action
) => {
  let userIndex;
  switch (action.type) {
    case "USERS_LOAD_SUCCEEDED":
      return Object.assign({}, state, {
        list: [].concat(action.payload.data.items),
        listLoaded: true
      });
    case "USERS_ADD_SUCCEEDED":
      const existing = state.list.findIndex(
        u => u.uuid === action.payload.data.uuid
      );
      if (existing > -1) {
        return state;
      }
      return Object.assign({}, state, {
        list: [].concat(state.list).concat([action.payload.data]),
        listLoaded: true
      });
    case "USERS_EDIT_SUCCEEDED":
      userIndex = state.list.findIndex(u => u.uuid === action.payload.uuid);
      if (userIndex > -1) {
        state.list[userIndex].role = action.payload.data.role;
      }
      return Object.assign({}, state, {
        list: [].concat(state.list)
      });
    case "USERS_DELETE_SUCCEEDED":
      userIndex = state.list.findIndex(u => u.uuid === action.payload.uuid);
      if (userIndex > -1) {
        state.list = state.list
          .slice(0, userIndex)
          .concat(state.list.slice(userIndex + 1));
      }
      return Object.assign({}, state, {
        list: [].concat(state.list)
      });
    case "USER_SWITCH_ORGANIZATION":
      return Object.assign({}, state, {
        list: [],
        listLoaded: false
      });
    case "USERS_CLEAR":
      return Object.assign({}, state, {
        list: [],
        listLoaded: false
      });
    default:
      return state;
  }
};
