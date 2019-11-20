import React from 'react';

class ApiTokensTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      tokensLoaded: false,
      tokens: [],
    }
  }

  componentDidMount() {
    const { tokensLoaded } = this.state;
    const { loadApiTokens } = this.props;
    if (!tokensLoaded) {
      loadApiTokens()
        .then(() => {
          this.setState({
            tokensLoaded: true
          });
        });
    }
  }

  render() {
    const { tokens, tokensLoaded } = this.state;
    const tokensRows = tokens && tokens.map((t) => {
      return <tr key={t.id}>
          <td>{t.jti}</td>
          <td>{t.name}</td>
          <td>{t.created}</td>
          <td>Revoke</td>
        </tr>
    });
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
                  <th style={{"width": "50%"}}>Token</th>
                  <th>Name</th>
                  <th>Created
                  <th>Actions</th>
                  </th>
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