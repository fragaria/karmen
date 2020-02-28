import React from "react";
import { Link } from "react-router-dom";

import PrintersTable from "../../listings/printers-table";
import NetworkScan from "../../forms/network-scan";

const Printers = ({
  orgslug,
  loadPrinters,
  printersList,
  printersLoaded,
  onPrinterDelete,
  networkInterface,
  onNetworkInterfaceChange,
  scanNetwork
}) => {
  return (
    <>
      <div className="container">
        <div className="react-tabs__tab-panel__header">
          <h1 className="react-tabs__tab-panel__header__title">Printers</h1>
          <Link to={`/${orgslug}/add-printer`} className="btn btn-sm">
            <span>+ Add a printer</span>
          </Link>
        </div>
      </div>

      <PrintersTable
        orgslug={orgslug}
        loadPrinters={loadPrinters}
        printersList={printersList}
        printersLoaded={printersLoaded}
        onPrinterDelete={onPrinterDelete}
      />

      <div className="container">
        <br />
        <br />
        <strong>Network scan</strong>
        <NetworkScan
          networkInterface={networkInterface}
          onNetworkInterfaceChange={onNetworkInterfaceChange}
          scanNetwork={scanNetwork}
        />
      </div>
    </>
  );
};
export default Printers;
