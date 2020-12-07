import React from "react";
import { Link } from "react-router-dom";

import PrintersTable from "../../listings/printers-table";

const Printers = ({
  orguuid,
  loadPrinters,
  printersList,
  printersLoaded,
  onPrinterUpdate,
  onPrinterDelete,
}) => {
  return (
    <>
      <div className="container">
        <div className="react-tabs__tab-panel__header">
          <h1 className="react-tabs__tab-panel__header__title">Printers</h1>
          <Link
            to={`/${orguuid}/add-printer`}
            className="btn btn-sm"
            id="btn-add_printer"
          >
            <span>+ Add a printer</span>
          </Link>
        </div>
      </div>

      <PrintersTable
        orguuid={orguuid}
        loadPrinters={loadPrinters}
        printersList={printersList}
        printersLoaded={printersLoaded}
        onPrinterUpdate={onPrinterUpdate}
        onPrinterDelete={onPrinterDelete}
      />
    </>
  );
};
export default Printers;
