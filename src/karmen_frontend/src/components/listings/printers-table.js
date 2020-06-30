import React, { useState } from "react";
import { Link } from "react-router-dom";

import CtaDropdown from "./cta-dropdown";
import NoPaginationListing from "./no-pagination-wrapper";
import { useMyModal } from "../utils/modal";
import PrinterSettingsForm from "../printers/printer-settings";

const DeletePrinterModal = ({ printer, onPrinterDelete, modal }) => {
  return (
    <>
      {modal.isOpen && (
        <modal.Modal>
          <h1 className="modal-title text-center">Are you sure?</h1>
          <h3 className="text-center">
            You can add the printer back later by
            {printer.token ? (
              " using the token from your device."
            ) : (
              <>
                {" "}
                adding
                <br />{" "}
                <strong>
                  {printer.hostname || printer.ip}
                  {printer.port ? `:${printer.port}` : ""}
                  {printer.path ? `${printer.path}` : ""}
                </strong>
              </>
            )}
          </h3>

          <div className="cta-box text-center">
            <button
              className="btn"
              onClick={(e) => {
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

const PrinterSettingsModal = ({
  printer,
  onPrinterUpdate,
  modal,
  canUpdateTable,
}) => {
  const onSettingsChanged = (newSettings) =>
    onPrinterUpdate(printer.uuid, newSettings).then((r) => {
      if (r.status === 200) {
        canUpdateTable(true);
        modal.closeModal();
      }
    });

  return (
    <>
      {modal.isOpen && (
        <modal.Modal>
          <h1 className="modal-title text-center">
            Change properties of {printer.name}
          </h1>

          <PrinterSettingsForm
            printer={printer}
            onPrinterSettingsChanged={onSettingsChanged}
            onPrinterSettingsCancelled={() => {
              modal.closeModal();
              canUpdateTable(true);
            }}
          />

          <div className="cta-box text-center"></div>
        </modal.Modal>
      )}
    </>
  );
};

const PrintersTableRow = ({
  orguuid,
  printer,
  onPrinterUpdate,
  onPrinterDelete,
  canUpdateTable,
}) => {
  const deletePrinterModal = useMyModal();
  const printerSettingsModal = useMyModal();
  const [ctaListExpanded, setCtaListExpanded] = useState();
  return (
    <div className="list-item" role="listitem">
      <Link
        className="list-item-content"
        key={printer.uuid}
        to={`/${orguuid}/printers/${printer.uuid}`}
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
        <button
          className="dropdown-item text-secondary"
          onClick={(e) => {
            setCtaListExpanded(false);
            printerSettingsModal.openModal(e);
            canUpdateTable(false);
          }}
        >
          <i className="icon-edit"></i>
          Printer settings
        </button>
        <button
          className="dropdown-item text-secondary"
          onClick={(e) => {
            setCtaListExpanded(false);
            deletePrinterModal.openModal(e);
          }}
        >
          <i className="icon-trash"></i>
          Delete printer
        </button>
      </CtaDropdown>
      <PrinterSettingsModal
        printer={printer}
        onPrinterUpdate={onPrinterUpdate}
        modal={printerSettingsModal}
        canUpdateTable={canUpdateTable}
      />
      <DeletePrinterModal
        printer={printer}
        onPrinterDelete={onPrinterDelete}
        modal={deletePrinterModal}
      />
    </div>
  );
};

class PrintersTable extends React.Component {
  state = { canUpdate: true };

  shouldComponentUpdate(nextProps, nextState, nextContext) {
    return this.state.canUpdate;
  }
  constructor(props) {
    super(props);
    this.canUpdateTable = this.canUpdateTable.bind(this);
  }

  canUpdateTable(value) {
    if (this.state.canUpdate !== value) {
      this.setState({ canUpdate: value });
    }
  }
  render() {
    const {
      orguuid,
      onPrinterUpdate,
      onPrinterDelete,
      loadPrinters,
      printersLoaded,
      printersList,
    } = this.props;
    return (
      <NoPaginationListing
        defaultOrderBy="+name"
        loadItems={() => loadPrinters(["job", "status", "webcam", "lights"])}
        itemsLoaded={printersLoaded}
        items={printersList}
        enableFiltering={true}
        sortByColumns={["name"]}
        filterByColumns={["name"]}
        rowFactory={(p) => {
          return (
            <PrintersTableRow
              key={p.uuid}
              orguuid={orguuid}
              printer={p}
              onPrinterUpdate={onPrinterUpdate}
              onPrinterDelete={onPrinterDelete}
              canUpdateTable={this.canUpdateTable}
            />
          );
        }}
      />
    );
  }
}

export default PrintersTable;
