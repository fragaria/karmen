const initialState = {
  images: {},
  queue: {},
};

export default (
  state = {
    images: {},
    queue: {},
    activeOrganizationId: null,
  },
  action
) => {
  const { queue, activeOrganizationId } = state;
  switch (action.type) {
    case "WEBCAMS_INTERVAL_SET":
      return Object.assign({}, state, {
        queue: Object.assign({}, state.queue, {
          [action.payload.id]: Object.assign(
            {},
            state.queue[action.payload.id],
            {
              interval: action.payload.interval,
            }
          ),
        }),
      });
    case "WEBCAMS_TIMEOUT_SET":
      return Object.assign({}, state, {
        queue: Object.assign({}, state.queue, {
          [action.payload.id]: {
            interval: action.payload.interval,
            timeout: action.payload.timeout,
          },
        }),
      });
    case "WEBCAMS_GET_SNAPSHOT_SUCCEEDED":
      if (!action.payload || action.payload.organizationId !== activeOrganizationId) {
        return state;
      }
      let newImage = action.payload;
      if (!newImage) {
        state.images = Object.assign({}, state.images, {
          [newImage.id]: [undefined, action.payload.status],
        });
      } else {
        state.images = Object.assign({}, state.images, {
          [newImage.id]: [
            `${newImage.prefix}${newImage.data}`,
            action.payload.status,
          ],
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
        activeOrganizationId: action.payload.data.id,
      });
    default:
      return state;
  }
};
