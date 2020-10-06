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
                onPrinterDelete(printer.id).then(() => {
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

const PrintersTableRow = ({
  orguuid,
  printer,
  onPrinterUpdate,
  onPrinterDelete,
  pauseUpdates,
}) => {
  const deletePrinterModal = useMyModal();
  const [ctaListExpanded, setCtaListExpanded] = useState();
  return (
    <div className="list-item" role="listitem">
      <Link
        className="list-item-content"
        key={printer.id}
        to={`/${orguuid}/printers/${printer.id}`}
      >
        <span className="list-item-title">{printer.name}</span>
      </Link>

      <CtaDropdown
        expanded={ctaListExpanded}
        onToggle={() => {
          setCtaListExpanded(!ctaListExpanded);
        }}
      >
        <span className="dropdown-title">{printer.name}</span>
        <Link to={`/${orguuid}/printers/${printer.id}/tab-settings`} 
        className="dropdown-item text-secondary">
          <i className="icon-edit"></i>
          Printer settings
        </Link>
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
    this.pauseUpdates = this.pauseUpdates.bind(this);
  }

  pauseUpdates(value) {
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
        loadItems={() => loadPrinters(["job", "status", "webcam", "lights", "printjobs"])}
        itemsLoaded={printersLoaded}
        items={printersList}
        enableFiltering={true}
        sortByColumns={["name"]}
        filterByColumns={["name"]}
        rowFactory={(p) => {
          return (
            <PrintersTableRow
              key={p.id}
              orguuid={orguuid}
              printer={p}
              onPrinterUpdate={onPrinterUpdate}
              onPrinterDelete={onPrinterDelete}
              pauseUpdates={this.pauseUpdates}
            />
          );
        }}
      />
    );
  }
}

export default PrintersTable;
