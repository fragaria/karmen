import React from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

import PrintersTable from "../../listings/printers-table";
import NetworkScan from "../../forms/network-scan";
import { enqueueTask } from "../../../actions/misc";
import { setNetworkInterface } from "../../../actions/preferences";
import { loadPrinters, deletePrinter } from "../../../actions/printers";


const Printers = ({
  match,
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
          <h1 className="react-tabs__tab-panel__header__title">
            Printers
          </h1>
          <Link
            to={`/${match.params.orgslug}/add-printer`}
            className="btn btn-sm">
            <span>+ Add a printer</span>
          </Link>
        </div>
      </div>

      <PrintersTable
        orgslug={match.params.orgslug}
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
  )
}
export default connect(
  state => ({
    printersLoaded: state.printers.printersLoaded,
    printersList: state.printers.printers,
    networkInterface: state.preferences.networkInterface
  }),
  (dispatch, ownProps) => ({
    onPrinterDelete: uuid =>
      dispatch(deletePrinter(ownProps.match.params.orgslug, uuid)),
    loadPrinters: fields =>
      dispatch(loadPrinters(ownProps.match.params.orgslug, fields)),
    onNetworkInterfaceChange: networkInterface =>
      dispatch(setNetworkInterface(networkInterface)),
    scanNetwork: networkInterface =>
      dispatch(
        enqueueTask(ownProps.match.params.orgslug, "scan_network", {
          network_interface: networkInterface
        })
      )
  })
)(Printers);

