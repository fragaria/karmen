import React, { useState } from "react";
import CtaDropdown from "../listings/cta-dropdown";
import { useMyModal } from "../utils/modal";
import NoPaginationListing from "./no-pagination-wrapper";

const ChangeUserRoleModal = ({ user, onUserChange, modal }) => {
  return (
    <>
      {modal.isOpen && (
        <modal.Modal>
          <h1 className="modal-title text-center">Change user role</h1>
          <h3 className="modal-content text-center">
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
          <span className="dropdown-title">{user.username}</span>
          {!user.activated && (
            <button
              className="dropdown-item"
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
            className="dropdown-item"
            onClick={e => {
              setCtaListExpanded(false);
              changeUserRoleModal.openModal(e);
            }}
          >
            <i className="icon-edit"></i>
            Change role
          </button>
          <button
            className="dropdown-item text-secondary"
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

const UsersTable = ({
  currentUuid,
  loadUsers,
  usersLoaded,
  usersList,
  onUserChange,
  onUserDelete,
  onResendInvitation
}) => {
  return (
    <NoPaginationListing
      defaultOrderBy="+username"
      loadItems={() => loadUsers(["username", "uuid", "role"])}
      itemsLoaded={usersLoaded}
      items={usersList}
      enableFiltering={true}
      sortByColumns={["username", "uuid", "role"]}
      filterByColumns={["username"]}
      rowFactory={u => {
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
      }}
    />
  );
};

export default UsersTable;
