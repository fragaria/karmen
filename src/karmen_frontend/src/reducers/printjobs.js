const initialListState = {
  pages: [],
  orderBy: "-started",
  filter: null,
  limit: 10
};

export default (state = {}, action) => {
  switch (action.type) {
    case "JOBS_LOAD_PAGE_SUCCEEDED":
      if (action.payload.status !== 200) {
        return state;
      }
      let currentPrinter =
        state[action.payload.printer] || Object.assign({}, initialListState);
      let currentPages = currentPrinter.pages;
      // continue only with the same conditions
      if (
        currentPrinter.filter === action.payload.filter &&
        currentPrinter.orderBy === action.payload.orderBy &&
        currentPrinter.limit === action.payload.limit
      ) {
        // TODO possibly switch to findIndex
        const origPage = currentPages.find(
          p => p.startWith === action.payload.startWith
        );
        if (!origPage && action.payload.data) {
          currentPages.push({
            data: action.payload.data,
            startWith: action.payload.startWith
          });
        }
        if (origPage && action.payload.data) {
          const origIndex = currentPages.indexOf(origPage);
          currentPages[origIndex] = {
            data: action.payload.data,
            startWith: action.payload.startWith
          };
        }
        // if any option changes, reset pages
      } else {
        currentPages = [
          {
            data: action.payload.data,
            startWith: action.payload.startWith
          }
        ];
      }
      return Object.assign({}, state, {
        [action.payload.printer]: Object.assign({}, currentPrinter, {
          pages: [].concat(currentPages),
          orderBy: action.payload.orderBy,
          filter: action.payload.filter,
          limit: action.payload.limit
        })
      });
    case "JOBS_CLEAR_PAGES":
      return Object.assign({}, state, {
        [action.payload.printer]: Object.assign({}, initialListState)
      });
    default:
      return state;
  }
};
