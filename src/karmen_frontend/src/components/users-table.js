import React from 'react';
import formatters from '../services/formatters';

class UsersTableRow extends React.Component {

  render() {
    const { user } = this.props;

    return (
      <tr>
        <td>{user.uuid}</td>
        <td>{user.username}</td>
        <td>{user.role}</td>
        <td>{formatters.bool(user.suspended)}</td>
        <td className="action-cell">
          Suspend, changeRole
        </td>
      </tr>
    );
  }
}

class UsersTable extends React.Component {
  state = {
    usersLoaded: false,
    currentPageIndex: 0,
  }

  componentDidMount() {
    const { usersLoaded } = this.state;
    const { userList, loadUsersPage } = this.props;
    if (!userList.pages || !userList.pages.length || !usersLoaded) {
      loadUsersPage(null, userList.orderBy, userList.usernameFilter, userList.limit)
        .then(() => {
          this.setState({usersLoaded: true});
        });
    }
  }

  componentWillUnmount() {
    const { clearUsersPages } = this.props;
    clearUsersPages();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.currentPageIndex !== this.state.currentPageIndex) {
      const { userList, loadUsersPage } = this.props;
      const prevPage = userList.pages[prevState.currentPageIndex];
      // Going to next, this might not be loaded in state yet
      if (prevState.currentPageIndex < this.state.currentPageIndex) {
        let nextStartWith = null;
        if (prevPage && prevPage.data && prevPage.data.next) {
          const uri = new URL(prevPage.data.next.indexOf('http') !== 0 ? `http://karmen.local${prevPage.data.next}` : prevPage.data.next)
          nextStartWith = uri.searchParams.get('start_with');
        }
        if (!userList.pages.find((p) => p.startWith === nextStartWith)) {
          this.setState({
            usersLoaded: false,
          });
          loadUsersPage(nextStartWith, userList.orderBy, userList.usernameFilter, userList.limit)
            .then(() => {
              this.setState({
                usersLoaded: true,
              });
            });
        }
      }
    }
  }

  render() {
    const { usersLoaded, currentPageIndex } = this.state;
    const { userList } = this.props;
    const currentPage = userList.pages[currentPageIndex];
    const users = currentPage && currentPage.data.items;
    const usersRows = users && users.map((u) => {
      return <UsersTableRow key={u.uuid} user={u} />;
    });
    return (
      <div>
        {!usersLoaded
          ? <p className="message-block">Loading...</p>
          : (!usersRows || usersRows.length === 0
            ? <p className="message-error message-block">No users found!</p>
            : (
            <>
              <table>
                <thead>
                  <tr>
                    <th>
                      UUID
                    </th>
                    <th>
                      Username
                    </th>
                    <th>
                      Role
                    </th>
                    <th>
                      Suspended
                    </th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {usersRows}
                </tbody>
              </table>
              <div className="table-pagination">
                  {currentPageIndex > 0
                    ? <button className="plain" onClick={() => {
                      this.setState({
                        currentPageIndex: Math.max(0, currentPageIndex - 1),
                      });
                    }}>Previous</button>
                    : <span></span>}
                  {currentPage.data.next
                    ? <button className="plain" onClick={() => {
                      this.setState({
                        currentPageIndex: currentPageIndex + 1
                      });
                    }}>Next</button>
                    : <span></span>}
              </div>
            </>
          ))
        }
      </div>
    );
  }
}

export default UsersTable;