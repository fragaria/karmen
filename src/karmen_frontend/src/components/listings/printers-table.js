import React, { useState } from "react";
import { Link } from "react-router-dom";
import { DebounceInput } from "react-debounce-input";

import Sorting from "./sorting";
import CtaDropdown from "./cta-dropdown";
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
        <span className="list-dropdown-title">{printer.name}</span>
        <Link
          className="list-dropdown-item"
          to={`/${orgslug}/printers/${printer.uuid}/settings`}
        >
          <i className="icon-edit"></i>
          Printer settings
        </Link>
        <button
          className="list-dropdown-item text-secondary"
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

class PrintersTable extends React.Component {
  state = {
    filter: "",
    orderBy: "+name"
  };

  componentDidMount() {
    // TODO this might be more efficient
    const { loadPrinters } = this.props;
    loadPrinters(["job", "status", "webcam"]);
  }

  render() {
    const { filter, orderBy } = this.state;
    const {
      orgslug,
      printersLoaded,
      printersList,
      onPrinterDelete
    } = this.props;
    const printersRows = printersList
      .filter(p => p.name.indexOf(filter) !== -1)
      .sort((p, r) => {
        let result = -1;
        if (p.name > r.name) {
          result = 1;
        } else if (p.name === r.name) {
          result = p.ip > r.ip ? 1 : -1;
        }
        if (orderBy === "-name") {
          return -result;
        }
        return result;
      })
      .map(p => {
        return (
          <PrintersTableRow
            key={p.uuid}
            orgslug={orgslug}
            printer={p}
            onPrinterDelete={onPrinterDelete}
          />
        );
      });

    return (
      <div className="list">
        <div className="list-header">
          <div className="list-search">
            <label htmlFor="filter">
              <span className="icon icon-search"></span>
              <DebounceInput
                type="search"
                name="filter"
                id="filter"
                minLength={3}
                debounceTimeout={300}
                onChange={e => {
                  this.setState({
                    filter: e.target.value
                  });
                }}
              />
            </label>
          </div>

          <Sorting
            active={orderBy}
            columns={["name"]}
            onChange={() => {
              return () => {
                const { orderBy } = this.state;
                this.setState({
                  orderBy: orderBy === "+name" ? "-name" : "+name"
                });
              };
            }}
          />
        </div>

        {!printersLoaded ? (
          <p className="list-item list-item-message">Loading...</p>
        ) : !printersRows || printersRows.length === 0 ? (
          <p className="list-item list-item-message">No printers found!</p>
        ) : (
          <>{printersRows}</>
        )}
      </div>
    );
  }
}

export default PrintersTable;
