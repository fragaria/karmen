import React from "react";
import { Link } from "react-router-dom";
import { DebounceInput } from "react-debounce-input";
import TableActionRow from "./table-action-row";
import Sorting from "./sorting";

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
            onPrinterDelete(printer.host);
          }}
        >
          Are you sure? You can add the printer back later by adding{" "}
          <code>{printer.host}</code>.
        </TableActionRow>
      );
    }

    return (
      <div className="list-item">
        <div className="list-item-content">
          <span className="list-item-title">{printer.name}</span>
          <span>
            {printer.hostname
              ? `${printer.hostname} (${printer.host})`
              : printer.host}
          </span>
        </div>
        <div className="list-item-cta">
          <Link
            className="btn-reset"
            title="Settings"
            to={`/printers/${printer.host}`}
          >
            <i className="icon-printer"></i>
          </Link>
          <Link
            className="btn-reset"
            title="Settings"
            to={`/printers/${printer.host}/settings`}
          >
            <i className="icon-edit"></i>
          </Link>
          <button
            className="btn-reset"
            title="Delete printer"
            onClick={() => {
              this.setState({
                showDeletePrinterRow: true
              });
            }}
          >
            <i className="icon-trash text-secondary"></i>
          </button>
        </div>
      </div>
    );
  }
}

class PrintersTable extends React.Component {
  state = {
    filter: "",
    sort: "+name"
  };
  componentDidMount() {
    // TODO this might be more efficient
    const { loadPrinters } = this.props;
    loadPrinters(["job", "status", "webcam"]);
  }

  render() {
    const { filter, sort } = this.state;
    const { printersLoaded, printersList, onPrinterDelete } = this.props;
    const printersRows = printersList
      .filter(p => p.name.indexOf(filter) !== -1)
      .sort((p, r) => {
        let result = -1;
        if (p.name > r.name) {
          result = 1;
        }
        if (sort === "-name") {
          return -result;
        }
        return result;
      })
      .map(p => {
        return (
          <PrintersTableRow
            key={p.host}
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
            active={sort}
            collection={["name"]}
            onChange={() => {
              const { sort } = this.state;
              this.setState({
                sort: sort === "+name" ? "-name" : "+name"
              });
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
