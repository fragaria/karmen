import React from "react";
import { useMyModal } from "../../components/utils/modal";
import BusyButton from "../../components/utils/busy-button";
import formatters from "../../services/formatters";
import NoPaginationListing from "./no-pagination-wrapper";

const DeleteTokenModal = ({ modal, token, onTokenDelete }) => {
  return (
    <>
      {modal.isOpen && (
        <modal.Modal>
          <h1 className="modal-title text-center">Revoke the token</h1>
          <h3 className="text-center">
            Do you really want to revoke token <strong>"{token.name}"</strong>?
            This cannot be undone.
          </h3>

          <div className="cta-box text-center">
            <BusyButton
              className="btn btn-sm"
              type="submit"
              onClick={e => {
                e.preventDefault();
                onTokenDelete(token.jti);
                modal.closeModal();
              }}
              busyChildren="Working..."
            >
              Yes, revoke this token
            </BusyButton>
            <button className="btn btn-plain" onClick={modal.closeModal}>
              Cancel
            </button>
          </div>
        </modal.Modal>
      )}
    </>
  );
};

const ApiTokensTableRow = ({ token, onTokenDelete }) => {
  const deleteTokenModal = useMyModal();

  return (
    <div className="list-item">
      <div className="list-item-content">
        <span className="list-item-title">{token.name}</span>
        <span>created for {token.organization.name}</span>{" "}
        <span>on {formatters.datetime(token.created)}</span>
      </div>

      <div className="list-item-cta">
        <button className="btn-reset" onClick={deleteTokenModal.openModal}>
          <i className="icon-trash text-secondary"></i>
        </button>
      </div>

      <DeleteTokenModal
        modal={deleteTokenModal}
        token={token}
        onTokenDelete={onTokenDelete}
      />
    </div>
  );
};

const ApiTokensTable = ({
  loadTokens,
  tokensLoaded,
  tokensList,
  onTokenDelete
}) => {
  return (
    <NoPaginationListing
      defaultOrderBy="-created"
      loadItems={loadTokens}
      itemsLoaded={tokensLoaded}
      items={tokensList}
      enableFiltering={true}
      sortByColumns={["name", "created"]}
      filterByColumns={["name"]}
      rowFactory={t => {
        return (
          <ApiTokensTableRow
            key={t.jti}
            onTokenDelete={onTokenDelete}
            token={t}
          />
        );
      }}
    />
  );
};

export default ApiTokensTable;
