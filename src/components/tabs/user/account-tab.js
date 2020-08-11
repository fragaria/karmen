import React from "react";

import UserEditForm from "../../forms/user-edit-form";
import ChangePasswordForm from "../../forms/change-password-form";

const Account = ({ changePassword, patchMe, username, email }) => {
  return (
    <>
      <div className="container">
        <div className="react-tabs__tab-panel__header">
          <h1 className="react-tabs__tab-panel__header__title">
            Change profile
          </h1>
        </div>
        <UserEditForm patchMe={patchMe} username={username} email={email} />
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
