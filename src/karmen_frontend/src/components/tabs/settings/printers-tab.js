import React from "react";
import { Link } from "react-router-dom";

import PrintersTable from "../../listings/printers-table";
import NetworkScan from "../../forms/network-scan";

const Printers = ({
  orguuid,
  loadPrinters,
  printersList,
  printersLoaded,
  onPrinterDelete,
  networkInterface,
  onNetworkInterfaceChange,
  scanNetwork,
}) => {
  return (
    <>
      <div className="container">
        <div className="react-tabs__tab-panel__header">
          <h1 className="react-tabs__tab-panel__header__title">Printers</h1>
          <Link to={`/${orguuid}/add-printer`} className="btn btn-sm">
            <span>+ Add a printer</span>
          </Link>
        </div>
      </div>

      <PrintersTable
        orguuid={orguuid}
        loadPrinters={loadPrinters}
        printersList={printersList}
        printersLoaded={printersLoaded}
        onPrinterDelete={onPrinterDelete}
      />

      {!window.env.IS_CLOUD_INSTALL && (
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
      )}
    </>
  );
};
export default Printers;
