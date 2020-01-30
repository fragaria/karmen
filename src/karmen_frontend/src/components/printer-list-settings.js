import React from "react";
import { Link } from "react-router-dom";
import { DebounceInput } from "react-debounce-input";

import TableSorting from "./table-sorting";
import ListCta from "./list-cta";
import { useMyModal } from "./modal";

const DeletePrinter = ({ printer, onPrinterDelete }) => {
  const { openModal, closeModal, isOpen, Modal } = useMyModal(); 

  return (
    <>
      <button
        className="list-dropdown-item text-secondary"
        onClick={openModal}
      >
        <i className="icon-trash"></i>
        Delete printer
      </button>
      
      {isOpen && (
        <Modal>
          <h1 className="modal-title text-center">Are you sure?</h1>
          <h2 className="text-center">You can add the printer back later by adding</h2>
          <code>
            {printer.hostname || printer.ip}
            {printer.port ? `:${printer.port}` : ""}
          </code>

          <div className="cta-box text-center">
            <button 
              className="btn"
              onClick={() => {
                onPrinterDelete(printer.uuid);
              }}
            >
              Yes, delete it
            </button>

            <button 
              className="btn btn-plain"
              onClick={closeModal}
            >
              Cancel
            </button>
          </div>          
        </Modal>
      )}
    </>
  )
}

class PrintersTableRow extends React.Component {
  render() {
    const { printer, onPrinterDelete } = this.props;

    return (
      <div className="list-item">
        <Link
          className="list-item-content"
          key={printer.uuid}
          to={`/printers/${printer.uuid}`}
        >
          <span className="list-item-title">{printer.name}</span>
          <span>
            {printer.hostname
              ? `${printer.hostname}${
                  printer.port ? `:${printer.port}` : ""
                } (${printer.ip}${printer.port ? `:${printer.port}` : ""})`
              : `${printer.ip}${printer.port ? `:${printer.port}` : ""}`}
          </span>
        </Link>

        <ListCta>
          <Link
            className="list-dropdown-item"
            to={`/printers/${printer.uuid}/settings`}
          >
            <i className="icon-edit"></i>
            Printer settings
          </Link>
          <DeletePrinter 
            printer={printer} 
            onPrinterDelete={onPrinterDelete}
          />
        </ListCta>
      </div>
    );
  }
}

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
    const { printersLoaded, printersList, onPrinterDelete } = this.props;
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

          <TableSorting
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

/* actions - inline delete, click leading to printers/<>, click leading to printers/<>/settings */
