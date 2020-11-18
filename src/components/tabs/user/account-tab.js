import React from "react";

import UserEditForm from "../../forms/user-edit-form";
import ChangePasswordForm from "../../forms/change-password-form";

const Account = ({ changePassword, username, email }) => {
  // we moved to email only, but some test/system accounts have only username without email
  //so we keep both but display only one, primary email
  return (
    <>
      <div className="container">
        <div className="react-tabs__tab-panel__header">
          <h1 className="react-tabs__tab-panel__header__title">Profile</h1>
        </div>
        <UserEditForm email={email ? email : username} />
      </div>

      <div className="container">
        <div className="react-tabs__tab-panel__header">
          <h1 className="react-tabs__tab-panel__header__title">
            Change password
          </h1>
        </div>
        <ChangePasswordForm changePassword={changePassword} />
      </div>
    </>
  );
};

export default Account;
