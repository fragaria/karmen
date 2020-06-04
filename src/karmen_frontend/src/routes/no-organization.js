import React from "react";
import { Redirect, Link } from "react-router-dom";
import { connect } from "react-redux";
import { FormInputs } from "../components/forms/form-utils";
import FreshTokenGateway from "../components/gateways/fresh-token-gateway";
import BusyButton from "../components/utils/busy-button";
import { HttpError } from "../errors";
import { deletePrinter, loadPrinters, patchPrinter } from "../actions/printers";
import {
  addUser,
  deleteUser,
  enqueueTask,
  getOrganizations,
  getUsers,
  patchOrganization,
  patchUser,
  setNetworkInterface,
} from "../actions";

const NoOrganization = ({ activeOrganization }) => {
  console.log(activeOrganization);
  if (activeOrganization) {
    return <Redirect to={`/${activeOrganization.uuid}`} />;
  }
  return (
    <>
      <div className="content">
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
