import React from "react";

import ChangePasswordForm from "../../forms/change-password-form";

const Account = ({ loadApiTokens, onUserStateChanged }) => {
  return (
    <>
      <div className="container">
        <div className="react-tabs__tab-panel__header">
          <h1 className="react-tabs__tab-panel__header__title">
            Change password
          </h1>
        </div>
      </div>

      <ChangePasswordForm
        onUserStateChanged={() => {
          return loadApiTokens();
        }}
      />
    </>
  );
};

export default Account;
