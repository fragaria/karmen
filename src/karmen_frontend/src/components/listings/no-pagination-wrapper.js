import React from "react";
import { DebounceInput } from "react-debounce-input";
import Sorting from "./sorting";

class Wrapper extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      filter: "",
      orderBy: props.defaultOrderBy
    };
  }

  componentDidMount() {
    const { itemsLoaded, loadItems } = this.props;
    if (!itemsLoaded) {
      loadItems();
    }
  }

  render() {
    const { filter, orderBy } = this.state;
    const {
      itemsLoaded,
      items,
      rowFactory,
      enableFiltering,
      sortByColumns,
      filterByColumns
    } = this.props;
    const itemRows = items
      .filter(p => {
        for (let c of filterByColumns || []) {
          if (p[c].toLowerCase().indexOf(filter.toLowerCase()) !== -1) {
            return 1;
          }
        }
        return 0;
      })
      .sort((a, b) => {
        const columnName = orderBy.substring(1);
        if (a[columnName] === b[columnName]) {
          return a.uuid > b.uuid ? -1 : 1;
        }
        if (orderBy[0] === "+") {
          return a[columnName] < b[columnName] ? -1 : 1;
        } else {
          return a[columnName] > b[columnName] ? -1 : 1;
        }
      })
      .map(rowFactory);

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
                  onChange={e => {
                    this.setState({
                      filter: e.target.value
                    });
                  }}
                />
              </label>
            </div>
          )}

          <Sorting
            active={orderBy}
            columns={sortByColumns || []}
            onChange={column => {
              return () => {
                const { orderBy } = this.state;
                this.setState({
                  orderBy:
                    orderBy === `+${column}` ? `-${column}` : `+${column}`
                });
              };
            }}
          />
        </div>

        {!itemsLoaded ? (
          <p className="list-item list-item-message">Loading...</p>
        ) : !itemRows || itemRows.length === 0 ? (
          <p className="list-item list-item-message">No items found!</p>
        ) : (
          <>{itemRows}</>
        )}
      </div>
    );
  }
}

export default Wrapper;
