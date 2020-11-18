export default (
  state = {
    list: [],
    listLoaded: false,
    invitationsList: [],
    invitationsLoaded: false,
  },
  action
) => {
  let userIndex;
  switch (action.type) {
    case "USERS_LOAD_SUCCEEDED":
      return Object.assign({}, state, {
        list: [].concat(action.payload.data),
        listLoaded: true,
      });
    case "PENDING_USERS_LOAD_SUCCEEDED":
      return Object.assign({}, state, {
        invitationsList: [].concat(action.payload.data.pendingInvitations),
        invitationsLoaded: true,
      });
    case "USERS_ADD_SUCCEEDED":
      if(action.payload.status === 201) {
        const existing = state.list.findIndex(
          (u) => u.id === action.payload.data.userId
        );
        if (existing > -1) {
          return state;
        }
        action.payload.data.email = action.payload.data.username;
        return Object.assign({}, state, {
          list: [].concat(state.list).concat([action.payload.data]),
          listLoaded: true,
        });
      } else if (action.payload.status === 202) {
        // This means user was added to pending invitations.
        // Instead of doing some messy stuff on BE to make the endpoint return data we need and make it
        // return different data in different scenarios, we just make FE think the list of invitations
        // was not loaded yet, so it can fetch it again and show updated data
        return Object.assign({}, state, {
          invitationsLoaded: false,
        });
      }
      return state;
    case "USERS_EDIT_SUCCEEDED":
      userIndex = state.list.findIndex((u) => u.userId === action.payload.id);
      if (userIndex > -1) {
        state.list[userIndex].role = action.payload.data.role;
      }
      return Object.assign({}, state, {
        list: [].concat(state.list),
      });
    case "USERS_DELETE_SUCCEEDED":
      userIndex = state.list.findIndex((u) => u.userId === action.payload.id);
      if (userIndex > -1) {
        state.list = state.list
          .slice(0, userIndex)
          .concat(state.list.slice(userIndex + 1));
      }
      return Object.assign({}, state, {
        list: [].concat(state.list),
      });
    case "USER_SWITCH_ORGANIZATION":
      return Object.assign({}, state, {
        list: [],
        listLoaded: false,
      });
    case "USERS_CLEAR":
      return Object.assign({}, state, {
        list: [],
        listLoaded: false,
      });
    default:
      return state;
  }
};
