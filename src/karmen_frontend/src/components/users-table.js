import React from "react";
import formatters from "../services/formatters";

class UsersTableRow extends React.Component {
  state = {
    showChangeRoleRow: false,
    showSuspendRow: false
  };

  render() {
    const { currentUuid, user, onUserChange } = this.props;
    const { showChangeRoleRow, showSuspendRow } = this.state;

    if (showSuspendRow) {
      return (
        <tr className="inverse">
          <td colSpan="4">
            Do you really want to {user.suspended ? "allow" : "disallow"}{" "}
            <strong>{user.username}</strong>?
          </td>
          <td className="action-cell">
            <button
              className="plain"
              title="Cancel"
              onClick={() => {
                this.setState({
                  showSuspendRow: false
                });
              }}
            >
              <i className="icon icon-cross"></i>
            </button>
            <button
              className="plain"
              title="Confirm"
              onClick={() => {
                onUserChange(user.uuid, user.role, !user.suspended).then(() => {
                  this.setState({
                    showSuspendRow: false
                  });
                });
              }}
            >
              <i className="icon icon-checkmark"></i>
            </button>
          </td>
        </tr>
      );
    }

    if (showChangeRoleRow) {
      return (
        <tr className="inverse">
          <td colSpan="4">
            Do you really want to {user.role === "admin" ? "demote" : "promote"}{" "}
            <strong>{user.username}</strong> to{" "}
            {user.role === "admin" ? "user" : "admin"}?
          </td>
          <td className="action-cell">
            <button
              className="plain"
              title="Cancel"
              onClick={() => {
                this.setState({
                  showChangeRoleRow: false
                });
              }}
            >
              <i className="icon icon-cross"></i>
            </button>
            <button
              className="plain"
              title="Confirm"
              onClick={() => {
                // this will get more complicated, obviously
                const newRole = user.role === "user" ? "admin" : "user";
                onUserChange(user.uuid, newRole, user.suspended).then(() => {
                  this.setState({
                    showChangeRoleRow: false
                  });
                });
              }}
            >
              <i className="icon icon-checkmark"></i>
            </button>
          </td>
        </tr>
      );
    }

    return (
      <tr>
        <td>{user.uuid}</td>
        <td>{user.username}</td>
        <td>{user.role}</td>
        <td>
          {formatters.bool(user.suspended) ? (
            <i className="icon icon-cross icon-state-cancel"></i>
          ) : (
            <i className="icon icon-checkmark icon-state-confirm"></i>
          )}
        </td>
        <td className="action-cell">
          {currentUuid !== user.uuid && (
            <>
              <button
                className="plain icon-link"
                title={user.suspended ? "Allow" : "Disallow"}
                onClick={() => {
                  this.setState({
                    showSuspendRow: true
                  });
                }}
              >
                {user.suspended ? (
                  <i className="icon icon-checkmark"></i>
                ) : (
                  <i className="icon icon-cross"></i>
                )}
              </button>
              <button
                className="plain icon-link"
                title="Change role"
                onClick={() => {
                  this.setState({
                    showChangeRoleRow: true
                  });
                }}
              >
                <i className="icon icon-file-text2"></i>
              </button>
            </>
          )}
        </td>
      </tr>
    );
  }
}

class UsersTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      usersLoaded: false,
      currentPageIndex: 0,
      willBeFilter: ""
    };
    this.reloadTableWith = this.reloadTableWith.bind(this);
  }

  componentDidMount() {
    const { usersLoaded } = this.state;
    const { userList } = this.props;
    if (!userList.pages || !userList.pages.length || !usersLoaded) {
      this.reloadTableWith(
        null,
        userList.orderBy,
        userList.usernameFilter,
        userList.limit
      );
    }
  }

  componentWillUnmount() {
    const { clearUsersPages } = this.props;
    clearUsersPages();
  }

  componentDidUpdate(prevProps, prevState) {
    if (prevState.currentPageIndex !== this.state.currentPageIndex) {
      const { userList } = this.props;
      const prevPage = userList.pages[prevState.currentPageIndex];
      // Going to next, this might not be loaded in state yet
      if (prevState.currentPageIndex < this.state.currentPageIndex) {
        let nextStartWith = null;
        if (prevPage && prevPage.data && prevPage.data.next) {
          const uri = new URL(formatters.absoluteUrl(prevPage.data.next));
          nextStartWith = uri.searchParams.get("start_with");
        }
        if (!userList.pages.find(p => p.startWith === nextStartWith)) {
          this.reloadTableWith(
            nextStartWith,
            userList.orderBy,
            userList.usernameFilter,
            userList.limit,
            this.state.currentPageIndex
          );
        }
      }
    }
  }

  reloadTableWith(nextStart, orderBy, usernameFilter, limit, currentPageIndex) {
    const { loadUsersPage } = this.props;
    this.setState({
      usersLoaded: false,
      willBeFilter: usernameFilter
    });
    loadUsersPage(nextStart, orderBy, usernameFilter, limit).then(() => {
      this.setState({
        currentPageIndex: currentPageIndex || 0,
        usersLoaded: true
      });
    });
  }

  render() {
    const { usersLoaded, currentPageIndex, willBeFilter } = this.state;
    const { currentUuid, userList, onUserChange } = this.props;
    const currentPage = userList.pages[currentPageIndex];
    const users = currentPage && currentPage.data.items;
    const usersRows =
      users &&
      users.map(u => {
        return (
          <UsersTableRow
            key={u.uuid}
            user={u}
            onUserChange={onUserChange}
            currentUuid={currentUuid}
          />
        );
      });

    const sortFactory = column => {
      return () => {
        const { userList } = this.props;
        let order = `+${column}`;
        if (userList.orderBy === `+${column}`) {
          order = `-${column}`;
        } else if (
          userList.orderBy === `-${column}` &&
          userList.orderBy !== "+username"
        ) {
          order = "+username";
        }
        this.reloadTableWith(
          null,
          order,
          userList.usernameFilter,
          userList.limit
        );
      };
    };

    return (
      <div>
        <form className="inline-form">
          <label htmlFor="filter">Filter by username</label>
          <input
            type="text"
            name="filter"
            id="filter"
            value={willBeFilter}
            onChange={e => {
              this.setState({
                willBeFilter: e.target.value
              });
            }}
          />
          <button
            type="submit"
            onClick={e => {
              e.preventDefault();
              const { willBeFilter } = this.state;
              const { userList } = this.props;
              this.reloadTableWith(
                null,
                userList.orderBy,
                willBeFilter,
                userList.limit
              );
            }}
          >
            Filter
          </button>
          <button
            type="reset"
            onClick={e => {
              e.preventDefault();
              const { userList } = this.props;
              this.setState({
                willBeFilter: ""
              });
              this.reloadTableWith(null, userList.orderBy, "", userList.limit);
            }}
          >
            Reset
          </button>
        </form>
        {!usersLoaded ? (
          <p className="message-block">Loading...</p>
        ) : !usersRows || usersRows.length === 0 ? (
          <p className="message-error message-block">No users found!</p>
        ) : (
          <>
            <table>
              <thead>
                <tr>
                  <th>
                    <button
                      className={`plain sorting-button ${
                        userList.orderBy.indexOf("uuid") > -1 ? "active" : ""
                      }`}
                      onClick={sortFactory("uuid")}
                    >
                      UUID
                    </button>
                  </th>
                  <th>
                    <button
                      className={`plain sorting-button ${
                        userList.orderBy.indexOf("username") > -1
                          ? "active"
                          : ""
                      }`}
                      onClick={sortFactory("username")}
                    >
                      Username
                    </button>
                  </th>
                  <th>
                    <button
                      className={`plain sorting-button ${
                        userList.orderBy.indexOf("role") > -1 ? "active" : ""
                      }`}
                      onClick={sortFactory("role")}
                    >
                      Role
                    </button>
                  </th>
                  <th>Allowed?</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>{usersRows}</tbody>
            </table>
            <div className="table-pagination">
              {currentPageIndex > 0 ? (
                <button
                  className="plain"
                  onClick={() => {
                    this.setState({
                      currentPageIndex: Math.max(0, currentPageIndex - 1)
                    });
                  }}
                >
                  Previous
                </button>
              ) : (
                <span></span>
              )}
              {currentPage.data.next ? (
                <button
                  className="plain"
                  onClick={() => {
                    this.setState({
                      currentPageIndex: currentPageIndex + 1
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

export default UsersTable;
