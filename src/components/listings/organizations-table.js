import React, {useState} from "react";
import {Link} from "react-router-dom";
import CtaDropdown from "../listings/cta-dropdown";
import NoPaginationListing from "./no-pagination-wrapper";
import {useMyModal} from "../utils/modal";

const DeleteUserModal = ({modal, user, organization, onUserDelete}) => {
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
                onUserDelete(organization.id, user.identity).then(() => {
                  modal.closeModal();
                });
              }}
            >
              Remove {user.username}!
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

const OrganizationsTableRow = ({
                                 organization,
                                 onOrganizationChange,
                                 onOrganizationDelete,
                                 onResendInvitation,
                                 currentUser,
                                 onUserDelete,
                                 rowsCount,
                               }) => {
  const [ctaListExpanded, setCtaListExpanded] = useState();
  const deleteuserModal = useMyModal();
  return (
    <div className="list-item">
      <Link
        className="list-item-content"
        key={organization.id}
        to={`/${organization.id}`}
      >
        <span className="list-item-title">{organization.name}</span>
        <span className="text-mono">{organization.id}; </span>
        <span>You are an </span><span
        style={{color: organization.role === "admin" ? "red" : "green"}}>{organization.role}</span>
      </Link>
      <CtaDropdown
        expanded={ctaListExpanded}
        onToggle={() => {
          setCtaListExpanded(!ctaListExpanded);
        }}
      >
        <div className="dropdown-items-content">
          <span className="dropdown-title">{organization.name}</span>
          {(organization.role === "admin") ?
            <Link
              className="dropdown-item"
              to={`/organizations/${organization.id}/settings`}
            >
              <i className="icon-edit"></i>
              Organization Settings
            </Link>
            :
            <>{rowsCount > 1 ?
              <button
                className="dropdown-item text-secondary"
                onClick={(e) => {
                  setCtaListExpanded(false);
                  deleteuserModal.openModal(e);
                }}
              >
                <i className="icon-trash"></i>
                Leave organization
              </button> :
              <span className="dropdown-item text-secondary">You can't leave your last organization.</span>
            }
            </>

          }

        </div>
      </CtaDropdown>
      <DeleteUserModal
        user={currentUser}
        organization={organization}
        onUserDelete={onUserDelete}
        modal={deleteuserModal}
      />
    </div>
  );
};

const OrganizationsTable = ({
                              loadOrganizations,
                              organizationsLoaded,
                              organizationsList,
                              onOrganizationChange,
                              onOrganizationDelete,
                              onResendInvitation,
                              currentUser,
                              onUserDelete,
                            }) => {
  return (
    <NoPaginationListing
      defaultOrderBy="+name"
      loadItems={loadOrganizations}
      itemsLoaded={organizationsLoaded}
      items={organizationsList}
      enableFiltering={false}
      enableSorting={false}
      sortByColumns={["name"]}
      filterByColumns={["name"]}
      rowFactory={(u) => {
        return (
          <OrganizationsTableRow
            key={u.id}
            organization={u}
            onOrganizationChange={onOrganizationChange}
            onOrganizationDelete={onOrganizationDelete}
            onResendInvitation={onResendInvitation}
            currentUser={currentUser}
            onUserDelete={onUserDelete}
            rowsCount={organizationsList.length}
          />
        );
      }}
    />
  );
};

export default OrganizationsTable;
