import React, { useState } from "react";
import { Link } from "react-router-dom";
import CtaDropdown from "./cta-dropdown";
import NoPaginationListing from "./no-pagination-wrapper";
import { useMyModal } from "../utils/modal";

const DeletePrinterModal = ({ printer, onPrinterDelete, modal }) => {
  return (
    <>
      {modal.isOpen && (
        <modal.Modal>
          <h1 className="modal-title text-center">Are you sure?</h1>
          <h3 className="text-center">
            You can add the printer back later by adding
            <br />
            <strong>
              {printer.hostname || printer.ip}
              {printer.port ? `:${printer.port}` : ""}
              {printer.path ? `${printer.path}` : ""}
            </strong>
          </h3>

          <div className="cta-box text-center">
            <button
              className="btn"
              onClick={e => {
                onPrinterDelete(printer.uuid).then(() => {
                  modal.closeModal(e);
                });
              }}
            >
              Yes, delete it
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

const PrintersTableRow = ({ orgslug, printer, onPrinterDelete }) => {
  const deletePrinterModal = useMyModal();
  const [ctaListExpanded, setCtaListExpanded] = useState();
  return (
    <div className="list-item">
      <Link
        className="list-item-content"
        key={printer.uuid}
        to={`/${orgslug}/printers/${printer.uuid}`}
      >
        <span className="list-item-title">{printer.name}</span>
        <span className="text-mono">
          {window.env.IS_CLOUD_INSTALL
            ? printer.token
            : printer.hostname
            ? `${printer.hostname}${printer.port ? `:${printer.port}` : ""}${
                printer.path ? `${printer.path}` : ""
              } (${printer.ip}${printer.port ? `:${printer.port}` : ""}${
                printer.path ? `${printer.path}` : ""
              })`
            : `${printer.ip}${printer.port ? `:${printer.port}` : ""}${
                printer.path ? `${printer.path}` : ""
              }`}
        </span>
      </Link>

      <CtaDropdown
        expanded={ctaListExpanded}
        onToggle={() => {
          setCtaListExpanded(!ctaListExpanded);
        }}
      >
        <span className="dropdown-title">{printer.name}</span>
        <Link
          className="dropdown-item"
          to={`/${orgslug}/printers/${printer.uuid}/settings`}
        >
          <i className="icon-edit"></i>
          Printer settings
        </Link>
        <button
          className="dropdown-item text-secondary"
          onClick={e => {
            setCtaListExpanded(false);
            deletePrinterModal.openModal(e);
          }}
        >
          <i className="icon-trash"></i>
          Delete printer
        </button>
      </CtaDropdown>
      <DeletePrinterModal
        printer={printer}
        onPrinterDelete={onPrinterDelete}
        modal={deletePrinterModal}
      />
    </div>
  );
};

const PrintersTable = ({
  orgslug,
  onPrinterDelete,
  loadPrinters,
  printersLoaded,
  printersList
}) => {
  return (
    <NoPaginationListing
      defaultOrderBy="+name"
      loadItems={() => loadPrinters(["job", "status", "webcam"])}
      itemsLoaded={printersLoaded}
      items={printersList}
      enableFiltering={true}
      sortByColumns={["name"]}
      filterByColumns={["name"]}
      rowFactory={p => {
        return (
          <PrintersTableRow
            key={p.uuid}
            orgslug={orgslug}
            printer={p}
            onPrinterDelete={onPrinterDelete}
          />
        );
      }}
    />
  );
};

export default PrintersTable;
