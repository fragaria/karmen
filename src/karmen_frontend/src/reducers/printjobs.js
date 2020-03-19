const initialListState = {
  pages: [],
  orderBy: "-started",
  filter: null,
  limit: 10
};

export default (state = {}, action) => {
  switch (action.type) {
    case "JOBS_LOAD_PAGE_SUCCEEDED":
      let currentPrinter =
        state[action.payload.printer] || Object.assign({}, initialListState);
      let currentPages = currentPrinter.pages;
      const newPage = {
        data: action.payload.data,
        startWith: action.payload.startWith
      };
      // continue only with the same conditions
      if (
        currentPrinter.filter === action.payload.filter &&
        currentPrinter.orderBy === action.payload.orderBy &&
        currentPrinter.limit === action.payload.limit
      ) {
        const origPageIndex = currentPages.findIndex(
          p => p.startWith === action.payload.startWith
        );
        if (origPageIndex === -1) {
          currentPages.push(newPage);
        } else {
          currentPages[origPageIndex] = newPage;
        }
      } else {
        currentPages = [newPage];
      }
      return Object.assign({}, state, {
        [action.payload.printer]: Object.assign({}, currentPrinter, {
          pages: [].concat(currentPages),
          orderBy: action.payload.orderBy,
          filter: action.payload.filter,
          limit: action.payload.limit
        })
      });
    case "USER_SWITCH_ORGANIZATION":
      return Object.assign({}, state, {});
    case "JOBS_CLEAR_PAGES":
      return Object.assign({}, state, {
        [action.payload.printer]: Object.assign({}, initialListState)
      });
    default:
      return state;
  }
};
