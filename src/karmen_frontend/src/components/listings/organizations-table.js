import React, { useState } from "react";
import { Link } from "react-router-dom";
import CtaDropdown from "../listings/cta-dropdown";
import NoPaginationListing from "./no-pagination-wrapper";

const OrganizationsTableRow = ({
  organization,
  onOrganizationChange,
  onOrganizationDelete,
  onResendInvitation
}) => {
  const [ctaListExpanded, setCtaListExpanded] = useState();

  return (
    <div className="list-item">
      <Link
        className="list-item-content"
        key={organization.uuid}
        to={`/${organization.slug}`}
      >
        <span className="list-item-title">{organization.name}</span>
        <span className="text-mono">{organization.slug}</span>
      </Link>

      <CtaDropdown
        expanded={ctaListExpanded}
        onToggle={() => {
          setCtaListExpanded(!ctaListExpanded);
        }}
      >
        <div className="dropdown-items-content">
          <span className="dropdown-title">{organization.name}</span>
          <Link
            className="dropdown-item"
            to={`/organizations/${organization.slug}/settings`}
          >
            <i className="icon-edit"></i>
            Organization Settings
          </Link>
        </div>
      </CtaDropdown>
    </div>
  );
};

const OrganizationsTable = ({
  loadOrganizations,
  organizationsLoaded,
  organizationsList,
  onOrganizationChange,
  onOrganizationDelete,
  onResendInvitation
}) => {
  return (
    <NoPaginationListing
      defaultOrderBy="+name"
      loadItems={loadOrganizations}
      itemsLoaded={organizationsLoaded}
      items={organizationsList}
      enableFiltering={true}
      sortByColumns={["name"]}
      filterByColumns={["name"]}
      rowFactory={u => {
        return (
          <OrganizationsTableRow
            key={u.uuid}
            organization={u}
            onOrganizationChange={onOrganizationChange}
            onOrganizationDelete={onOrganizationDelete}
            onResendInvitation={onResendInvitation}
          />
        );
      }}
    />
  );
};

export default OrganizationsTable;
