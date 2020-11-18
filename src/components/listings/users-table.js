import React, { useState } from "react";
import CtaDropdown from "../listings/cta-dropdown";
import { useMyModal } from "../utils/modal";
import NoPaginationListing from "./no-pagination-wrapper";
import formatters from "../../services/formatters";

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
                onUserChange(user.userId, newRole).then(() => {
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
                onUserDelete(user.userId).then(() => {
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
            The invitation email has been sent to {user.email}
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

const UsersTableRow = ({ currentId, user, onUserChange, onUserDelete }) => {
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
        </span>
        <span className="text-mono">
          {user.email}, {user.userId}
        </span>
      </div>

      {currentId !== user.id && (
        <CtaDropdown
          expanded={ctaListExpanded}
          onToggle={() => {
            setCtaListExpanded(!ctaListExpanded);
          }}
        >
          <span className="dropdown-title">{user.username}</span>
          <button
            className="dropdown-item"
            onClick={(e) => {
              setCtaListExpanded(false);
              changeUserRoleModal.openModal(e);
            }}
          >
            <i className="icon-edit"></i>
            Change role
          </button>
          <button
            className="dropdown-item text-secondary"
            onClick={(e) => {
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

const PendingInvitationTableRow = ({ user }) => {
  return (
    <div className="list-item">
      <div className="list-item-content">
        <span className="list-item-title">{user.email}</span>
        <span className="list-item-subtitle">
          <span>to be </span>
          <strong>{user.role}</strong>
        </span>
        <span className="text-mono">
          valid until {formatters.datetime(user.validUntil)}
        </span>
      </div>
    </div>
  );
};

const UsersTable = ({
  currentId,
  usersLoaded,
  usersList,
  onUserChange,
  onUserDelete,
  defaultOrderBy,
  loadItems,
  sortByColumns,
  filterByColumns,
  isUsers,
}) => {
  return (
    <NoPaginationListing
      defaultOrderBy={defaultOrderBy}
      loadItems={loadItems}
      itemsLoaded={usersLoaded}
      items={usersList}
      enableFiltering={false}
      sortByColumns={sortByColumns}
      filterByColumns={filterByColumns}
      rowFactory={(u) => {
        if (isUsers) {
          return (
            <UsersTableRow
              key={u.id}
              currentId={currentId}
              user={u}
              onUserChange={onUserChange}
              onUserDelete={onUserDelete}
            />
          );
        } else {
          return <PendingInvitationTableRow key={u.email} user={u} />;
        }
      }}
    />
  );
};

export default UsersTable;
