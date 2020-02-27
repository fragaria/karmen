import React, { useState } from "react";
import { Link } from "react-router-dom";
import { DebounceInput } from "react-debounce-input";
//import CtaDropdown from "../listings/cta-dropdown";
import Sorting from "./sorting";

const OrganizationsTableRow = ({
  organization,
  onOrganizationChange,
  onOrganizationDelete,
  onResendInvitation
}) => {
  const [ctaListExpanded, setCtaListExpanded] = useState();

  return (
    <div className="list-item">
      <div className="list-item-content">
        <Link
          className="list-item-content"
          key={organization.uuid}
          to={`/${organization.slug}`}
        >
          <span className="list-item-title">{organization.name}</span>
          <span className="text-mono">{organization.slug}</span>
        </Link>
      </div>

      {/*<CtaDropdown
        expanded={ctaListExpanded}
        onToggle={() => {
          setCtaListExpanded(!ctaListExpanded);
        }}
      >
        <span className="list-dropdown-title">{organization.name}</span>
        <button
          className="list-dropdown-item"
          onClick={e => {
            setCtaListExpanded(false);
            //changeOrganizationRoleModal.openModal(e);
          }}
        >
          <i className="icon-edit"></i>
          Edit organization
        </button>
      </CtaDropdown>*/}
    </div>
  );
};

class OrganizationsTable extends React.Component {
  state = {
    filter: "",
    orderBy: "-name"
  };

  componentDidMount() {
    // TODO this can be more efficient
    const { loadOrganizations } = this.props;
    loadOrganizations(["name"]);
  }

  render() {
    const { filter, orderBy } = this.state;
    const {
      organizationsLoaded,
      organizationsList,
      onOrganizationChange,
      onOrganizationDelete,
      onResendInvitation
    } = this.props;
    const organizationsRows = organizationsList
      .filter(u => u.name.toLowerCase().indexOf(filter.toLowerCase()) !== -1)
      .sort((u, q) => {
        let result = -1;
        if (u[orderBy] > q[orderBy]) {
          result = 1;
        } else if (u[orderBy] === q[orderBy]) {
          result = u.uuid > q.uuid ? 1 : -1;
        }
        if (orderBy[0] === "-") {
          return -result;
        }
        return result;
      })
      .map(u => {
        return (
          <OrganizationsTableRow
            key={u.uuid}
            organization={u}
            onOrganizationChange={onOrganizationChange}
            onOrganizationDelete={onOrganizationDelete}
            onResendInvitation={onResendInvitation}
          />
        );
      });

    return (
      <div className="list">
        <div className="list-header">
          <div className="list-search">
            <label htmlFor="filter">
              <span className="icon icon-search"></span>
              <DebounceInput
                type="search"
                name="filter"
                id="filter"
                minLength={3}
                debounceTimeout={300}
                onChange={e => {
                  this.setState({
                    filter: e.target.value
                  });
                }}
              />
            </label>
          </div>

          <Sorting
            active={orderBy}
            columns={["name"]}
            onChange={column => {
              return () => {
                const { orderBy } = this.state;
                this.setState({
                  orderBy:
                    orderBy === `+${column}` ? `-${column}` : `+${column}`
                });
              };
            }}
          />
        </div>

        {!organizationsLoaded ? (
          <p className="list-item list-item-message">Loading...</p>
        ) : !organizationsRows || organizationsRows.length === 0 ? (
          <p className="list-item list-item-message">No organizations found!</p>
        ) : (
          <>{organizationsRows}</>
        )}
      </div>
    );
  }
}

export default OrganizationsTable;
