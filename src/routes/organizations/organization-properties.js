import React from "react";
import { connect } from "react-redux";
import { Redirect } from "react-router-dom";
import Loader from "../../components/utils/loader";
import OrgRoleBasedGateway from "../../components/gateways/org-role-based-gateway";
import OrganizationEditForm from "../../components/forms/organization-edit-form";

import { getOrganizations, patchOrganization } from "../../actions";
import { HttpError } from "../../errors";

class OrganizationProperties extends React.Component {
  state = {
    organizationLoaded: false,
  };

  constructor(props) {
    super(props);
    this.changeOrganization = this.changeOrganization.bind(this);
  }

  changeOrganization(newParameters) {
    const { patchOrganization, organization } = this.props;
    return patchOrganization(organization.id, newParameters.name)
      .then(() => {
        this.props.history.push(`/organizations`);
        return {
          ok: true,
          message: "Changes saved successfully",
        };
      })
      .catch((err) => {
        if (err instanceof HttpError && err.response.status === 409) {
          return {
            ok: false,
            message:
              "An organization with such name already exists, please pick a different one.",
          };
        }
        return {
          ok: false,
          message:
            "We couldn't save your changes, there has been some error on the server.",
        };
      });
  }

  componentDidMount() {
    const { getOrganizations, organization } = this.props;
    if (!organization) {
      getOrganizations().then(() =>
        this.setState({
          organizationLoaded: true,
        })
      );
    } else {
      this.setState({
        organizationLoaded: true,
      });
    }
  }

  render() {
    const { organizationLoaded } = this.state;
    const { organization } = this.props;
    if (!organizationLoaded) {
      return (
        <div>
          <Loader />
        </div>
      );
    }
    if (!organization) {
      return <Redirect to="/page-404" />;
    }
    return (
      <OrgRoleBasedGateway
        requiredRole="admin"
        targetOrganizationRole={organization.role}
      >
        <section className="content">
          <div className="container">
            <h1 className="main-title text-center">
              Change properties of {organization.name}
            </h1>
            <OrganizationEditForm
              defaults={{
                name: organization.name,
              }}
              onSubmit={this.changeOrganization}
              onCancel={() => {
                this.props.history.push("/organizations");
              }}
            />
          </div>
        </section>
      </OrgRoleBasedGateway>
    );
  }
}

export default connect(
  (state, ownProps) => ({
    organization: state.organizations.list.find(
      (o) => o.id === ownProps.match.params.orgid
    ),
  }),
  (dispatch) => ({
    getOrganizations: () => dispatch(getOrganizations()),
    patchOrganization: (id, name) => dispatch(patchOrganization(id, name)),
  })
)(OrganizationProperties);
