import React, { useState } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

import RoleBasedGateway from "../components/gateways/role-based-gateway";
import FreshTokenGateway from "../components/gateways/fresh-token-gateway";
import NetworkScan from "../components/forms/network-scan";
import Listing from "../components/listings/wrapper";
import PrintersTable from "../components/listings/printers-table";
import CtaDropdown from "../components/listings/cta-dropdown";
import { useMyModal } from "../components/utils/modal";
import {
  getUsersPage,
  clearUsersPages,
  patchUser,
  retryIfUnauthorized
} from "../actions/users";
import { loadPrinters, deletePrinter } from "../actions/printers";
import { getSettings, changeSettings, enqueueTask } from "../services/backend";
import formatters from "../services/formatters";

const ChangeUserRoleModal = ({ user, onUserChange, modal }) => {
  return (
    <>
      {modal.isOpen && (
        <modal.Modal>
          <h1 className="modal-title text-center">Change user role</h1>
          <h2 className="text-center">
            Do you really want to {user.role === "admin" ? "demote" : "promote"}{" "}
            <strong>{user.username}</strong> to{" "}
            {user.role === "admin" ? "user" : "admin"}?
          </h2>

          <div className="cta-box text-center">
            <button
              className="btn"
              onClick={() => {
                const newRole = user.role === "user" ? "admin" : "user";
                onUserChange(user.uuid, newRole, user.suspended).then(() => {
                  modal.closeModal();
                });
              }}
            >
              Yes, change it
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

const ToggleUserSuspendButton = ({ isSuspended, onClick }) => {
  return (
    <button
      className={
        isSuspended
          ? "list-dropdown-item text-success"
          : "list-dropdown-item text-secondary"
      }
      onClick={onClick}
    >
      {isSuspended ? (
        <>
          <i className="icon-check"></i>
          Allow
        </>
      ) : (
        <>
          <i className="icon-trash"></i>
          Disallow
        </>
      )}
    </button>
  );
};

const ToggleUserSuspendModal = ({ modal, user, onUserChange }) => {
  return (
    <>
      {modal.isOpen && (
        <modal.Modal>
          <h1 className="modal-title text-center">
            {user.suspended ? "Enable " : "Disable "} user role
          </h1>
          <h2 className="text-center">
            Do you really want to {user.suspended ? "enable" : "disable"}{" "}
            <strong>{user.username}</strong>?
          </h2>

          <div className="cta-box text-center">
            <button
              className="btn"
              onClick={() => {
                onUserChange(user.uuid, user.role, !user.suspended).then(() => {
                  modal.closeModal();
                });
              }}
            >
              Yes, change it
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

const UsersTableRow = ({ currentUuid, user, onUserChange }) => {
  const toggleUserModal = useMyModal();
  const changeUserRoleModal = useMyModal();
  const [ctaListExpanded, setCtaListExpanded] = useState();

  return (
    <div className="list-item">
      <div className="list-item-content">
        <span className="list-item-title">{user.username}</span>
        <span className="list-item-subtitle">
          <span>is </span>
          <strong>{user.role} </strong>
          <span>and </span>
          {formatters.bool(user.suspended) ? (
            <strong className="text-secondary">disabled</strong>
          ) : (
            <strong className="text-success">enabled</strong>
          )}
        </span>
        <span className="text-mono">{user.uuid}</span>
      </div>

      {currentUuid !== user.uuid && (
        <CtaDropdown
          expanded={ctaListExpanded}
          onToggle={() => {
            setCtaListExpanded(!ctaListExpanded);
          }}
        >
          <button
            className="list-dropdown-item"
            onClick={e => {
              setCtaListExpanded(false);
              changeUserRoleModal.openModal(e);
            }}
          >
            <i className="icon-edit"></i>
            Change role
          </button>
          <ToggleUserSuspendButton
            isSuspended={user.suspended}
            onClick={e => {
              setCtaListExpanded(false);
              toggleUserModal.openModal(e);
            }}
          />
        </CtaDropdown>
      )}
      <ToggleUserSuspendModal
        user={user}
        onUserChange={onUserChange}
        modal={toggleUserModal}
      />
      <ChangeUserRoleModal
        user={user}
        onUserChange={onUserChange}
        modal={changeUserRoleModal}
      />
    </div>
  );
};

const Settings = ({
  currentUuid,
  loadUsersPage,
  clearUsersPages,
  userList,
  onUserChange,
  loadPrinters,
  printersList,
  printersLoaded,
  onPrinterDelete,
  getSettings,
  changeSettings,
  enqueueTask
}) => {
  return (
    <RoleBasedGateway requiredRole="admin">
      <FreshTokenGateway>
        <div className="content user-list">
          <div className="container">
            <h1 className="main-title">
              Printers
              <Link to="/add-printer" className="btn btn-sm">
                <span>+ Add a printer</span>
              </Link>
            </h1>
          </div>
          <PrintersTable
            loadPrinters={loadPrinters}
            printersList={printersList}
            printersLoaded={printersLoaded}
            onPrinterDelete={onPrinterDelete}
          />

          <div className="container">
            <br />
            <br />
            <strong>Network scan</strong>
            <NetworkScan
              getSettings={getSettings}
              changeSettings={changeSettings}
              enqueueTask={enqueueTask}
            />
          </div>

          <div className="container">
            <h1 className="main-title">
              Users
              <Link to="/add-user" className="btn btn-sm">
                <span>+ Add a user</span>
              </Link>
            </h1>
          </div>

          <Listing
            rowFactory={u => {
              return (
                <UsersTableRow
                  key={u.uuid}
                  user={u}
                  onUserChange={onUserChange}
                  currentUuid={currentUuid}
                />
              );
            }}
            itemList={userList}
            sortByColumns={["username", "uuid", "role"]}
            loadPage={loadUsersPage}
            clearItemsPages={clearUsersPages}
          />
        </div>
      </FreshTokenGateway>
    </RoleBasedGateway>
  );
};

export default connect(
  state => ({
    userList: state.users.list,
    printersList: state.printers.printers,
    printersLoaded: state.printers.printersLoaded,
    currentUuid: state.users.me.identity
  }),
  dispatch => ({
    loadPrinters: fields => dispatch(loadPrinters(fields)),
    onPrinterDelete: uuid => dispatch(deletePrinter(uuid)),
    loadUsersPage: (startWith, orderBy, filter, limit) =>
      dispatch(getUsersPage(startWith, orderBy, filter, limit)),
    clearUsersPages: () => dispatch(clearUsersPages()),
    onUserChange: (uuid, role, suspended) =>
      dispatch(patchUser(uuid, role, suspended)),
    // TODO move this to actions
    getSettings: () => retryIfUnauthorized(getSettings, dispatch)(),
    changeSettings: settings =>
      retryIfUnauthorized(changeSettings, dispatch)(settings),
    enqueueTask: task => retryIfUnauthorized(enqueueTask, dispatch)(task)
  })
)(Settings);
