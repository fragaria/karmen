import React, { useState } from "react";
import { DebounceInput } from "react-debounce-input";
import CtaDropdown from "../listings/cta-dropdown";
import { useMyModal } from "../utils/modal";
import Sorting from "./sorting";

const ChangeUserRoleModal = ({ user, onUserChange, modal }) => {
  return (
    <>
      {modal.isOpen && (
        <modal.Modal>
          <h1 className="modal-title text-center">Change user role</h1>
          <h3 className="text-center">
            Do you really want to {user.role === "admin" ? "demote" : "promote"}{" "}
            <strong>{user.username}</strong> to{" "}
            {user.role === "admin" ? "user" : "admin"}?
          </h3>

          <div className="cta-box text-center">
            <button
              className="btn"
              onClick={() => {
                const newRole = user.role === "user" ? "admin" : "user";
                onUserChange(user.uuid, newRole).then(() => {
                  modal.closeModal();
                });
              }}
            >
              Yes, change it
            </button>

            <button className="btn btn-plain" onClick={modal.closeModal}>
              Cancel
            </button>
          </div>
        </modal.Modal>
      )}
    </>
  );
};

const DeleteUserModal = ({ modal, user, onUserDelete }) => {
  return (
    <>
      {modal.isOpen && (
        <modal.Modal>
          <h1 className="modal-title text-center">Delete user</h1>
          <h3 className="text-center">
            Do you really want to delete <strong>{user.username}</strong>?
          </h3>

          <div className="cta-box text-center">
            <button
              className="btn"
              onClick={() => {
                onUserDelete(user.uuid).then(() => {
                  modal.closeModal();
                });
              }}
            >
              Yes, do it
            </button>

            <button className="btn btn-plain" onClick={modal.closeModal}>
              Cancel
            </button>
          </div>
        </modal.Modal>
      )}
    </>
  );
};

const InvitationSentModal = ({ modal, user }) => {
  return (
    <>
      {modal.isOpen && (
        <modal.Modal>
          <h1 className="modal-title text-center">
            The invitation e-mail has been sent to {user.email}
          </h1>

          <div className="cta-box text-center">
            <button className="btn" onClick={modal.closeModal}>
              Close
            </button>
          </div>
        </modal.Modal>
      )}
    </>
  );
};

const UsersTableRow = ({
  currentUuid,
  user,
  onUserChange,
  onUserDelete,
  onResendInvitation
}) => {
  const toggleUserModal = useMyModal();
  const changeUserRoleModal = useMyModal();
  const invitationSentModal = useMyModal();

  const [ctaListExpanded, setCtaListExpanded] = useState();

  return (
    <div className="list-item">
      <div className="list-item-content">
        <span className="list-item-title">{user.username}</span>
        <span className="list-item-subtitle">
          <span>is </span>
          <strong>{user.role}</strong>
          {!user.activated && (
            <>
              {" "}
              and <strong className="text-secondary">is not activated</strong>
            </>
          )}
        </span>
        <span className="text-mono">
          {user.email}, {user.uuid}
        </span>
      </div>

      {currentUuid !== user.uuid && (
        <CtaDropdown
          expanded={ctaListExpanded}
          onToggle={() => {
            setCtaListExpanded(!ctaListExpanded);
          }}
        >
          <span className="list-dropdown-title">{user.username}</span>
          {!user.activated && (
            <button
              className="list-dropdown-item"
              onClick={e => {
                setCtaListExpanded(false);
                onResendInvitation(user.email, user.role);
                invitationSentModal.openModal(e);
              }}
            >
              <i className="icon-edit"></i>
              Resend invitation
            </button>
          )}
          <button
            className="list-dropdown-item"
            onClick={e => {
              setCtaListExpanded(false);
              changeUserRoleModal.openModal(e);
            }}
          >
            <i className="icon-edit"></i>
            Change role
          </button>
          <button
            className="list-dropdown-item text-secondary"
            onClick={e => {
              setCtaListExpanded(false);
              toggleUserModal.openModal(e);
            }}
          >
            <i className="icon-trash"></i>
            Delete
          </button>
        </CtaDropdown>
      )}
      <DeleteUserModal
        user={user}
        onUserDelete={onUserDelete}
        modal={toggleUserModal}
      />
      <ChangeUserRoleModal
        user={user}
        onUserChange={onUserChange}
        modal={changeUserRoleModal}
      />
      <InvitationSentModal user={user} modal={invitationSentModal} />
    </div>
  );
};

class UsersTable extends React.Component {
  state = {
    filter: "",
    orderBy: "+username"
  };

  componentDidMount() {
    // TODO this can be more efficient
    const { loadUsers } = this.props;
    loadUsers(["username", "uuid", "role"]);
  }

  render() {
    const { filter, orderBy } = this.state;
    const {
      currentUuid,
      usersLoaded,
      usersList,
      onUserChange,
      onUserDelete,
      onResendInvitation
    } = this.props;
    const usersRows = usersList
      .filter(
        u => u.username.toLowerCase().indexOf(filter.toLowerCase()) !== -1
      )
      .sort((u, q) => {
        let result = -1;
        if (u[orderBy] > q[orderBy]) {
          result = 1;
        } else if (u[orderBy] === q[orderBy]) {
          result = u.uuid > q.uuid ? 1 : -1;
        }
        if (orderBy[0] === "-") {
          return -result;
        }
        return result;
      })
      .map(u => {
        return (
          <UsersTableRow
            key={u.uuid}
            currentUuid={currentUuid}
            user={u}
            onUserChange={onUserChange}
            onUserDelete={onUserDelete}
            onResendInvitation={onResendInvitation}
          />
        );
      });

    return (
      <div className="list">
        <div className="list-header">
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

          <Sorting
            active={orderBy}
            columns={["username", "uuid", "role"]}
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

        {!usersLoaded ? (
          <p className="list-item list-item-message">Loading...</p>
        ) : !usersRows || usersRows.length === 0 ? (
          <p className="list-item list-item-message">No users found!</p>
        ) : (
          <>{usersRows}</>
        )}
      </div>
    );
  }
}

export default UsersTable;
