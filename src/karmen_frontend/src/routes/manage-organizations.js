import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

import OrganizationsTable from "../components/listings/organizations-table";
import { getOrganizations, patchOrganization } from "../actions/organizations";

const ManageOrganizations = ({
  loadOrganizations,
  organizationsList,
  organizationsLoaded,
  onOrganizationChange
}) => {
  return (
    <section className="content">
      <div className="container">
        <h1 className="main-title">
          Organizations
          <Link to="/add-organization" className="btn btn-sm">
            + Create new organization
          </Link>
        </h1>
      </div>

      <OrganizationsTable
        loadOrganizations={loadOrganizations}
        organizationsList={organizationsList.filter(o => o.role === "admin")}
        organizationsLoaded={organizationsLoaded}
        onOrganizationChange={onOrganizationChange}
      />
    </section>
  );
};

export default connect(
  state => ({
    organizationsList: state.organizations.list,
    organizationsLoaded: state.organizations.listLoaded
  }),
  dispatch => ({
    loadOrganizations: () => dispatch(getOrganizations()),
    onOrganizationChange: name => dispatch(patchOrganization(name))
  })
)(ManageOrganizations);
