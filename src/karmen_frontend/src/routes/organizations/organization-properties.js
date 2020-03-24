import React from "react";
import { connect } from "react-redux";
import { Redirect } from "react-router-dom";
import Loader from "../../components/utils/loader";
import FreshTokenGateway from "../../components/gateways/fresh-token-gateway";
import OrgRoleBasedGateway from "../../components/gateways/org-role-based-gateway";
import OrganizationEditForm from "../../components/forms/organization-edit-form";

import { getOrganizations, patchOrganization } from "../../actions";

class OrganizationProperties extends React.Component {
  state = {
    organizationLoaded: false
  };

  constructor(props) {
    super(props);
    this.changeOrganization = this.changeOrganization.bind(this);
  }

  changeOrganization(newParameters) {
    const { patchOrganization, organization } = this.props;
    return patchOrganization(organization.uuid, newParameters.name).then(r => {
      switch (r.status) {
        case 200:
          this.props.history.push(`/organizations`);
          return {
            ok: true,
            message: "Changes saved successfully"
          };
        case 409:
          return {
            ok: false,
            message:
              "Pick a different name, there is already an organization of such name"
          };
        default:
          return {
            ok: false,
            message: "Cannot save your changes, check server logs"
          };
      }
    });
  }

  componentDidMount() {
    const { getOrganizations, organization } = this.props;
    if (!organization) {
      getOrganizations().then(() => {
        this.setState({
          organizationLoaded: true
        });
      });
    } else {
      this.setState({
        organizationLoaded: true
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
      <OrgRoleBasedGateway requiredRole="admin">
        <FreshTokenGateway>
          <section className="content">
            <div className="container">
              <h1 className="main-title text-center">
                Change properties of {organization.name}
              </h1>
              <OrganizationEditForm
                defaults={{
                  name: organization.name
                }}
                onSubmit={this.changeOrganization}
                onCancel={() => {
                  this.props.history.push("/organizations");
                }}
              />
            </div>
          </section>
        </FreshTokenGateway>
      </OrgRoleBasedGateway>
    );
  }
}

export default connect(
  (state, ownProps) => ({
    organization: state.organizations.list.find(
      o => o.uuid === ownProps.match.params.orguuid
    )
  }),
  dispatch => ({
    getOrganizations: () => dispatch(getOrganizations()),
    patchOrganization: (uuid, name) => dispatch(patchOrganization(uuid, name))
  })
)(OrganizationProperties);
