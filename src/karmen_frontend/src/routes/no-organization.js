import React from "react";
import { Redirect, Link } from "react-router-dom";
import { connect } from "react-redux";

const NoOrganization = ({ activeOrganization }) => {
  console.log(activeOrganization);
  if (activeOrganization) {
    return <Redirect to={`/${activeOrganization.uuid}`} />;
  }
  return (
    <>
      <div className="content" data-cy="authenticated-org-root">
        <div className="container">
          <h1 className="main-title">Welcome to Karmen</h1>
          <p>
            Looks like you aren't member of any organization. This means that
            you were removed from all of your's organizations by their's
            administrators. Before you can start managing any printers, you need
            to have an organization first.
          </p>
          <div className="cta-box text-center">
            <Link to={`/add-organization`} className="btn">
              Create new organization
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default connect((state) => ({
  activeOrganization: state.me.activeOrganization,
}))(NoOrganization);
