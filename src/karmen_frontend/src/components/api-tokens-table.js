import React from "react";
import formatters from "../services/formatters";
import TableActionRow from "./table-action-row";
import TableSorting from "./table-sorting";

class ApiTokensTableRow extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showDeleteRow: false
    };
  }

  render() {
    const { token, onTokenDelete } = this.props;
    const { showDeleteRow } = this.state;

    if (showDeleteRow) {
      return (
        <TableActionRow
          onCancel={() => {
            this.setState({
              showDeleteRow: false
            });
          }}
          onConfirm={() => {
            onTokenDelete(token.jti);
          }}
        >
          Do you really want to revoke <strong>{token.name}</strong>? This
          cannot be undone.
        </TableActionRow>
      );
    }

    return (
      <div className="list-item">
        <span>{token.name}</span>
        <span>{token.jti}</span>
        <span>{formatters.datetime(token.created)}</span>
        <div className="list-item-cta">
          <button
            className="btn-reset"
            onClick={() => {
              this.setState({
                showDeleteRow: true
              });
            }}
          >
            <i className="icon-trash text-secondary"></i>
          </button>
        </div>
      </div>
    );
  }
}

class ApiTokensTable extends React.Component {
  constructor(props) {
    super(props);
    this.sortTable = this.sortTable.bind(this);
    this.state = {
      sortedTokens: [],
      orderBy: "-created"
    };
  }

  componentDidMount() {
    const { tokensLoaded, loadTokens } = this.props;
    if (!tokensLoaded) {
      loadTokens();
    }
    const { orderBy } = this.state;
    this.sortTable(orderBy);
  }

  componentDidUpdate(prevProps) {
    if (prevProps.tokens !== this.props.tokens) {
      const { orderBy } = this.state;
      this.sortTable(orderBy);
    }
  }

  sortTable(orderBy) {
    const { tokens } = this.props;
    const sortedTokens =
      tokens &&
      tokens.sort((a, b) => {
        const columnName = orderBy.substring(1);
        if (orderBy[0] === "+") {
          return a[columnName] < b[columnName] ? -1 : 1;
        } else {
          return a[columnName] > b[columnName] ? -1 : 1;
        }
      });
    this.setState({
      sortedTokens,
      orderBy
    });
  }

  render() {
    const { tokensLoaded, onTokenDelete } = this.props;
    const { orderBy, sortedTokens } = this.state;
    const tokensRows =
      sortedTokens &&
      sortedTokens.map(t => {
        return (
          <ApiTokensTableRow
            onTokenDelete={onTokenDelete}
            key={t.jti}
            token={t}
          />
        );
      });
    return (
      <div className="list">
        {!tokensLoaded ? (
          <p className="list-item list-item-message">Loading...</p>
        ) : !tokensRows || tokensRows.length === 0 ? (
          <p className="list-item list-item-message">No API tokens found!</p>
        ) : (
          <>
            <div className="list-header">
              <TableSorting
                active={orderBy}
                columns={["name", "jti", "created"]}
                onChange={column => {
                  return () => {
                    const { orderBy } = this.state;
                    this.sortTable(
                      orderBy === `+${column}` ? `-${column}` : `+${column}`
                    );
                  };
                }}
              />
            </div>
            {tokensRows}
          </>
        )}
      </div>
    );
  }
}

export default ApiTokensTable;
