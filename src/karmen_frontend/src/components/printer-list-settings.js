import React from "react";
import { Link } from "react-router-dom";
import { DebounceInput } from "react-debounce-input";
import TableActionRow from "./table-action-row";
import TableSorting from "./table-sorting";
import ListCta from "./list-cta";

class PrintersTableRow extends React.Component {
  state = {
    showDeletePrinterRow: false
  };
  render() {
    const { showDeletePrinterRow } = this.state;
    const { printer, onPrinterDelete } = this.props;

    if (showDeletePrinterRow) {
      return (
        <TableActionRow
          onCancel={() => {
            this.setState({
              showDeletePrinterRow: false
            });
          }}
          onConfirm={() => {
            onPrinterDelete(printer.uuid);
          }}
        >
          Are you sure? You can add the printer back later by adding{" "}
          <code>
            {printer.hostname || printer.ip}
            {printer.port ? `:${printer.port}` : ""}
          </code>
          .
        </TableActionRow>
      );
    }

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
          <button
            className="list-dropdown-item text-secondary"
            onClick={() => {
              this.setState({
                showDeletePrinterRow: true
              });
            }}
          >
            <i className="icon-trash"></i>
            Delete printer
          </button>
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
