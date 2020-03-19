const initialState = {
  images: {},
  queue: {}
};

export default (
  state = {
    images: {},
    queue: {},
    activeOrganizationUuid: null
  },
  action
) => {
  const { queue, activeOrganizationUuid } = state;
  switch (action.type) {
    case "WEBCAMS_INTERVAL_SET":
      return Object.assign({}, state, {
        queue: Object.assign({}, state.queue, {
          [action.payload.uuid]: Object.assign(
            {},
            state.queue[action.payload.uuid],
            {
              interval: action.payload.interval
            }
          )
        })
      });
    case "WEBCAMS_TIMEOUT_SET":
      return Object.assign({}, state, {
        queue: Object.assign({}, state.queue, {
          [action.payload.uuid]: {
            interval: action.payload.interval,
            timeout: action.payload.timeout
          }
        })
      });
    case "WEBCAMS_GET_SNAPSHOT_SUCCEEDED":
      if (action.payload.organizationUuid !== activeOrganizationUuid) {
        return state;
      }
      let newImage = action.payload;
      if (!newImage || newImage.status !== 200) {
        state.images = Object.assign({}, state.images, {
          [newImage.uuid]: undefined
        });
      } else {
        state.images = Object.assign({}, state.images, {
          [newImage.uuid]: `${newImage.prefix}${newImage.data}`
        });
      }
      return state;
    case "USER_CLEAR_ENDED":
      for (let job in queue) {
        clearInterval(job.interval);
      }
      return Object.assign({}, initialState);
    case "USER_SWITCH_ORGANIZATION":
      for (let job in queue) {
        clearInterval(job.interval);
      }
      return Object.assign({}, initialState, {
        activeOrganizationUuid: action.payload.data.uuid
      });
    default:
      return state;
  }
};
