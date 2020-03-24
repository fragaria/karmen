const initialListState = {
  list: {
    pages: [],
    orderBy: "-uploaded",
    filter: null,
    limit: 10,
    fields: [],
  },
};

export default (
  state = {
    list: {
      pages: [],
      orderBy: "-uploaded",
      filter: null,
      limit: 10,
      fields: [],
    },
  },
  action
) => {
  switch (action.type) {
    case "GCODES_LOAD_PAGE_SUCCEEDED":
      const { orderBy, filter, limit, fields } = state.list;
      const newPage = {
        data: action.payload.data,
        startWith: action.payload.startWith,
      };
      let { pages } = state.list;
      // continue only with the same conditions
      if (
        filter === action.payload.filter &&
        orderBy === action.payload.orderBy &&
        limit === action.payload.limit &&
        fields.length === action.payload.fields.length // TODO This is a bad check, it should compare array contents
      ) {
        const origPageIndex = pages.findIndex(
          (p) => p.startWith === action.payload.startWith
        );
        if (origPageIndex === -1) {
          pages.push(newPage);
        } else {
          pages[origPageIndex] = newPage;
        }
      } else {
        pages = [newPage];
      }
      return Object.assign({}, state, {
        list: {
          pages: [].concat(pages),
          orderBy: action.payload.orderBy,
          filter: action.payload.filter,
          limit: action.payload.limit,
          fields: action.payload.fields,
        },
      });
    case "GCODES_DELETE_SUCCEEDED":
      const newPages = state.list.pages.map((p) => {
        if (p.data && p.data.items) {
          const origItemIndex = p.data.items.findIndex(
            (p) => p.uuid === action.payload.uuid
          );
          if (origItemIndex > -1) {
            return Object.assign({}, p, {
              data: Object.assign({}, p.data, {
                items: [].concat(
                  p.data.items
                    .slice(0, origItemIndex)
                    .concat(p.data.items.slice(origItemIndex + 1))
                ),
              }),
            });
          }
        }
        return p;
      });
      return Object.assign({}, state, {
        list: Object.assign({}, state.list, {
          pages: newPages,
        }),
      });
    case "USER_SWITCH_ORGANIZATION":
      return Object.assign({}, state, initialListState);
    case "GCODES_CLEAR_PAGES":
      return Object.assign({}, state, initialListState);
    default:
      return state;
  }
};
