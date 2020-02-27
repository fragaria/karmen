import React, { useState } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

import Listing from "../components/listings/wrapper";
import CtaDropdown from "../components/listings/cta-dropdown";

const ManageOrganizations = () => {
  return (
    <section className="content">
      <div className="container">
        <h1 className="main-title">
          Organizations
          <Link
            to={`/`}
            className="btn btn-sm"
          >
            + Create new organization
          </Link>
        </h1>
      </div>

    </section>
  );
}


export default ManageOrganizations;
