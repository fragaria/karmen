import React from "react";
import { Link } from "react-router-dom";

import ApiTokensTable from "../../listings/api-tokens-table";

const ApiTokens = ({
  loadApiTokens,
  apiTokens,
  apiTokensLoaded,
  onTokenDelete,
}) => {
  return (
    <>
      <div className="container">
        <div className="react-tabs__tab-panel__header">
          <h1 className="react-tabs__tab-panel__header__title">API tokens</h1>
          <Link to="/users/me/tokens" className="btn btn-sm">
            <span>+ Add a token</span>
          </Link>
        </div>
      </div>

      <ApiTokensTable
        loadTokens={loadApiTokens}
        tokensList={apiTokens}
        tokensLoaded={apiTokensLoaded}
        onTokenDelete={onTokenDelete}
      />
    </>
  );
};
export default ApiTokens;
