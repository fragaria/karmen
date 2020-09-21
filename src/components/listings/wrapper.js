import React from "react";
import { DebounceInput } from "react-debounce-input";
import Sorting from "./sorting";
import formatters from "../../services/formatters";

class Wrapper extends React.Component {
  state = {
    itemsLoaded: false,
    currentPageIndex: 0,
  };
  constructor(props) {
    super(props);
    this.reloadTableWith = this.reloadTableWith.bind(this);
  }

  componentDidMount() {
    const { itemsLoaded } = this.state;
    const { itemList } = this.props;
    if (!itemList.pages || !itemList.pages.length || !itemsLoaded) {
      this.reloadTableWith(
        null,
        itemList.orderBy,
        itemList.filter,
        itemList.limit
      );
    }
  }

  componentWillUnmount() {
    const { clearItemsPages } = this.props;
    clearItemsPages && clearItemsPages();
  }

  componentDidUpdate(prevProps, prevState) {
    // renavigate if i'm on a page with no records - for example after a delete of the last item
    const { itemList } = this.props;
    const currentPage =
      itemList.pages && itemList.pages[this.state.currentPageIndex];
    if (
      currentPage &&
      currentPage.data &&
      !currentPage.data.next &&
      currentPage.data.items &&
      currentPage.data.items.length === 0 &&
      this.state.currentPageIndex - 1 >= 0
    ) {
      this.setState({
        currentPageIndex: this.state.currentPageIndex - 1,
      });
      return;
    }
    if (prevState.currentPageIndex !== this.state.currentPageIndex) {
      const { itemList } = this.props;
      const prevPage = itemList.pages[prevState.currentPageIndex];
      // Going to next, this might not be loaded in state yet
      if (prevState.currentPageIndex < this.state.currentPageIndex) {
        let nextStartWith = null;
        if (prevPage && prevPage.data && prevPage.data.next) {
          const uri = new URL(formatters.absoluteUrl(prevPage.data.next));
          nextStartWith = uri.searchParams.get("start_with");
        }
        if (!itemList.pages.find((p) => p.startWith === nextStartWith)) {
          this.reloadTableWith(
            nextStartWith,
            itemList.orderBy,
            itemList.filter,
            itemList.limit,
            this.state.currentPageIndex
          );
        }
      }
    }
  }

  reloadTableWith(nextStart, orderBy, filter, limit, currentPageIndex) {
    const { loadPage, fields } = this.props;
    this.setState({
      itemsLoaded: false,
    });
    return loadPage(nextStart, orderBy, filter, limit, fields).then(() => {
      this.setState({
        currentPageIndex: currentPageIndex || 0,
        itemsLoaded: true,
      });
    });
  }

  render() {
    const { itemsLoaded, currentPageIndex } = this.state;
    const {
      itemList,
      rowFactory,
      sortByColumns,
      enableFiltering,
      enableSorting,
    } = this.props;
    const currentPage = itemList.pages && itemList.pages[currentPageIndex];
    const items = currentPage && currentPage.data && currentPage.data.items;
    const itemRows = items && items.map(rowFactory);

    return (
      <div className="list">
        <div className="list-header">
          {enableFiltering !== false && (
            <div className="list-search">
              <label htmlFor="filter">
                <span className="icon icon-search"></span>
                <DebounceInput
                  type="search"
                  name="filter"
                  id="filter"
                  minLength={3}
                  debounceTimeout={300}
                  onChange={(e) => {
                    const { itemList } = this.props;
                    this.reloadTableWith(
                      null,
                      itemList.orderBy,
                      e.target.value,
                      itemList.limit
                    );
                  }}
                />
              </label>
            </div>
          )}
          {enableSorting !== false && (
            <Sorting
              active={itemList.orderBy || ""}
              columns={sortByColumns || []}
              onChange={(column) => {
                return () => {
                  const { itemList } = this.props;
                  return this.reloadTableWith(
                    null,
                    itemList.orderBy === `+${column}`
                      ? `-${column}`
                      : `+${column}`,
                    itemList.filter,
                    itemList.limit
                  );
                };
              }}
            />
          )}
        </div>

        {!itemsLoaded ? (
          <p className="list-item list-item-message">Loading...</p>
        ) : !itemRows || itemRows.length === 0 ? (
          <p className="list-item list-item-message">No items found!</p>
        ) : (
          <>
            {itemRows}
            <div className="list-pagination">
              {currentPageIndex > 0 ? (
                <button
                  className="btn btn-sm"
                  onClick={() => {
                    this.setState({
                      currentPageIndex: Math.max(0, currentPageIndex - 1),
                    });
                  }}
                >
                  Previous
                </button>
              ) : (
                <span></span>
              )}
              {currentPageIndex > 0 && currentPage.data.next && " "}
              {currentPage.data.next ? (
                <button
                  className="btn btn-sm"
                  onClick={() => {
                    this.setState({
                      currentPageIndex: currentPageIndex + 1,
                    });
                  }}
                >
                  Next
                </button>
              ) : (
                <span></span>
              )}
            </div>
          </>
        )}
      </div>
    );
  }
}

export default Wrapper;
