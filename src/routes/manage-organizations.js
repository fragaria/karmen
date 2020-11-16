import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

import OrganizationsTable from "../components/listings/organizations-table";
import {deleteUser, getOrganizations, patchOrganization} from "../actions";

const ManageOrganizations = ({
  loadOrganizations,
  organizationsList,
  organizationsLoaded,
  onOrganizationChange,
  currentUser,
  onUserDelete,
}) => {
  return (
    <section className="content">
      <div className="container">
        <h1 className="main-title">
          Organizations
          <Link
            to="/add-organization"
            className="btn btn-sm"
            id="btn-create_organization"
          >
            + Create new organization
          </Link>
        </h1>
      </div>

      <OrganizationsTable
        loadOrganizations={loadOrganizations}
        organizationsList={organizationsList}
        organizationsLoaded={organizationsLoaded}
        onOrganizationChange={onOrganizationChange}
        currentUser={currentUser}
        onUserDelete={onUserDelete}
      />
    </section>
  );
};

export default connect(
  (state) => ({
    organizationsList: state.organizations.list,
    organizationsLoaded: state.organizations.listLoaded,
    currentUser: state.me,
  }),
  (dispatch) => ({
    loadOrganizations: () => dispatch(getOrganizations()),
    onOrganizationChange: (name) => dispatch(patchOrganization(name)),
    onUserDelete: (org_id, user_id) => dispatch(deleteUser(org_id, user_id)),
  })
)(ManageOrganizations);
