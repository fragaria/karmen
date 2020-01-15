import React from "react";
import { DebounceInput } from "react-debounce-input";
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
        <div className="list-item list-item-inverse">
          <div className="list-item-content">
            <span className="list-item-title">
              Do you really want to {user.suspended ? "allow" : "disallow"}{" "}
              <strong>{user.username}</strong>?
            </span>
          </div>

          <div className="list-item-cta">
            <button
              className="btn-reset"
              title="Cancel"
              onClick={() => {
                this.setState({
                  showSuspendRow: false
                });
              }}
            >
              <i className="icon-close"></i>
            </button>
            <button
              className="btn-reset"
              title="Confirm"
              onClick={() => {
                onUserChange(user.uuid, user.role, !user.suspended).then(() => {
                  this.setState({
                    showSuspendRow: false
                  });
                });
              }}
            >
              <i className="icon-check"></i>
            </button>
          </div>
        </div>
      );
    }

    if (showChangeRoleRow) {
      return (
        <div className="list-item list-item-inverse">
          <div className="list-item-content">
            <span className="list-item-title">
              Do you really want to{" "}
              {user.role === "admin" ? "demote" : "promote"}{" "}
              <strong>{user.username}</strong> to{" "}
              {user.role === "admin" ? "user" : "admin"}?
            </span>
          </div>

          <div className="list-item-cta">
            <button
              className="btn-reset"
              title="Cancel"
              onClick={() => {
                this.setState({
                  showChangeRoleRow: false
                });
              }}
            >
              <i className="icon-close"></i>
            </button>
            <button
              className="btn-reset"
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
              <i className="icon-check"></i>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="list-item">
        <div className="list-item-content">
          <span className="list-item-title">{user.username}</span>
          <span className="list-item-subtitle">
            <span>is </span>
            <strong>{user.role} </strong>
            <span>and </span>
            {formatters.bool(user.suspended) ? (
              <strong className="text-secondary">disabled</strong>
            ) : (
              <strong className="text-success">enabled</strong>
            )}
          </span>
          <span>{user.uuid}</span>
        </div>

        <div className="list-item-cta">
          {currentUuid !== user.uuid && (
            <>
              <button
                className="btn-reset"
                title={user.suspended ? "Allow" : "Disallow"}
                onClick={() => {
                  this.setState({
                    showSuspendRow: true
                  });
                }}
              >
                {user.suspended ? (
                  <i className="icon-check text-success"></i>
                ) : (
                  <i className="icon-close text-secondary"></i>
                )}
              </button>
              <button
                className="btn-reset"
                title="Change role"
                onClick={() => {
                  this.setState({
                    showChangeRoleRow: true
                  });
                }}
              >
                <i className="icon-edit"></i>
              </button>
            </>
          )}
        </div>
      </div>
    );
  }
}

class UsersTable extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      usersLoaded: false,
      currentPageIndex: 0
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
      usersLoaded: false
    });
    loadUsersPage(nextStart, orderBy, usernameFilter, limit).then(() => {
      this.setState({
        currentPageIndex: currentPageIndex || 0,
        usersLoaded: true
      });
    });
  }

  render() {
    const { usersLoaded, currentPageIndex } = this.state;
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
      <>
        <div className="container">
          <form className="input-group">
            <label htmlFor="filter">
              <span className="input-label-icon icon-search"></span>
              <DebounceInput
                type="search"
                name="filter"
                id="filter"
                minLength={3}
                debounceTimeout={300}
                onChange={e => {
                  const { userList } = this.props;
                  this.reloadTableWith(
                    null,
                    userList.orderBy,
                    e.target.value,
                    userList.limit
                  );
                }}
              />
            </label>
          </form>
        </div>

        <div className="list">
          {!usersLoaded ? (
            <p className="list-item list-item-message">Loading...</p>
          ) : !usersRows || usersRows.length === 0 ? (
            <p className="list-item list-item-message">No users found!</p>
          ) : (
            <>
              <div className="list-header">
                <button
                  className={`plain sorting-button ${
                    userList.orderBy.indexOf("uuid") > -1 ? "active" : ""
                  }`}
                  onClick={sortFactory("uuid")}
                >
                  UUID
                </button>
                <button
                  className={`plain sorting-button ${
                    userList.orderBy.indexOf("username") > -1 ? "active" : ""
                  }`}
                  onClick={sortFactory("username")}
                >
                  Username
                </button>
                <button
                  className={`plain sorting-button ${
                    userList.orderBy.indexOf("role") > -1 ? "active" : ""
                  }`}
                  onClick={sortFactory("role")}
                >
                  Role
                </button>
              </div>

              {usersRows}

              <div className="list-pagination">
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
      </>
    );
  }
}

export default UsersTable;
