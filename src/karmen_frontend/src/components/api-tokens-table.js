import React from 'react';
import formatters from '../services/formatters';

class ApiTokensTableRow extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      showDeleteRow: false,
    };
  }

  render() {
    const { token, onTokenDelete } = this.props;
    const { showDeleteRow } = this.state;

    if (showDeleteRow) {
      return (
        <tr className="inverse">
          <td colSpan="3">
            Do you really want to revoke <strong>{token.name}</strong>? This cannot be undone.
          </td>
          <td className="action-cell">
            <button className="plain" title="Cancel" onClick={() => {
              this.setState({
                showDeleteRow: false,
              });
            }}><i className="icon icon-cross"></i></button>
            <button className="plain" title="Confirm revoke" onClick={() => {
              onTokenDelete(token.jti);
            }}><i className="icon icon-checkmark"></i></button>
          </td>
        </tr>
      );
    }

    return (
      <tr>
        <td>{token.jti}</td>
        <td>{token.name}</td>
        <td>{formatters.datetime(token.created)}</td>
        <td className="action-cell">
          <button className="plain icon-link" onClick={() => {
            this.setState({
              showDeleteRow: true,
            })
          }}><i className="icon icon-bin"></i></button>
        </td>
      </tr>
    );
  }
}

class ApiTokensTable extends React.Component {

  constructor(props) {
    super(props);
    this.sortTable = this.sortTable.bind(this);
    this.state = {
      sortedTokens: [],
      orderBy: '-created',
    }
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
    const sortedTokens = tokens.sort((a, b) => {
      const columnName = orderBy.substring(1)
      if (orderBy[0] === '+') {
        return a[columnName] < b[columnName] ? -1 : 1;
      } else {
        return a[columnName] > b[columnName] ? -1 : 1;
      }
    });
    this.setState({
      sortedTokens,
      orderBy,
    })
  }

  render() {
    const { tokensLoaded, onTokenDelete } = this.props;
    const { orderBy, sortedTokens } = this.state;
    const tokensRows = sortedTokens && sortedTokens.map((t) => {
      return <ApiTokensTableRow onTokenDelete={onTokenDelete} key={t.jti} token={t} />;
    });
    const sortFactory = (column) => {
      return () => {
        const { orderBy } = this.state;
        let order = `+${column}`;
        if (orderBy === `+${column}`) {
          order = `-${column}`;
        } else if (orderBy === `-${column}` && orderBy !== '-created') {
          order = '-created';
        }
        this.sortTable(order);
      }
    }
    return (
      <div>
        {!tokensLoaded
          ? <p className="message-block">Loading...</p>
          : (!tokensRows || tokensRows.length === 0
            ? <p className="message-error message-block">No API tokens found!</p>
            : (
            <table>
              <thead>
                <tr>
                  <th>
                    <button className={`plain sorting-button ${orderBy.indexOf('jti') > -1 ? 'active' : ''}`} onClick={sortFactory("jti")}>Token ID</button>
                  </th>
                  <th>
                    <button className={`plain sorting-button ${orderBy.indexOf('name') > -1 ? 'active' : ''}`} onClick={sortFactory("name")}>Name</button>
                  </th>
                  <th>
                    <button className={`plain sorting-button ${orderBy.indexOf('created') > -1 ? 'active' : ''}`} onClick={sortFactory("created")}>Created</button>
                  </th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tokensRows}
              </tbody>
            </table>
          ))
        }
      </div>
    );
  }
}

export default ApiTokensTable;