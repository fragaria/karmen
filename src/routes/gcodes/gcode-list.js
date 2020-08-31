import React, { useState } from "react";
import { connect } from "react-redux";
import { Link } from "react-router-dom";

import SetActiveOrganization from "../../components/gateways/set-active-organization";
import Listing from "../../components/listings/wrapper";
import CtaDropdown from "../../components/listings/cta-dropdown";
import { useMyModal } from "../../components/utils/modal";
import { usePrintGcodeModal } from "../../components/gcodes/print-gcode-modal";
import {
  getGcodesPage,
  clearGcodesPages,
  deleteGcode,
  addPrintJob,
  loadPrinters,
} from "../../actions";
import formatters from "../../services/formatters";

const DeleteModal = ({ modal, path, display, onRowDelete }) => {
  return (
    <>
      {modal.isOpen && (
        <modal.Modal>
          <h1 className="modal-title text-center">Delete G-Code</h1>

          <h3 className="modal-subtitle text-center">
            Do you really want to delete{" "}
            <strong>
              {path}
              {path ? "/" : ""}
              {display}
            </strong>
            ? This cannot be undone.
          </h3>

          <div className="cta-box text-center">
            <button
              className="btn"
              onClick={(e) => {
                onRowDelete().then(() => {
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

const GcodeTableRow = ({
  orguuid,
  analysis,
  id,
  size,
  uploaded,
  uploadedBy,
  name,
  path,
  display,
  printGcode,
  downloadUrl,
  onSchedulePrint,
  availablePrinters,
  onRowDelete,
}) => {
  const deleteModal = useMyModal();
  const printModal = usePrintGcodeModal({
    gcode: {
      id,
      analysis,
    },
    printGcode,
    onSchedulePrint,
    availablePrinters,
  });

  const [ctaListExpanded, setCtaListExpanded] = useState();

  return (
    <div className="list-item">
      <Link className="list-item-content" to={`/${orguuid}/gcodes/${id}`}>
        <span className="list-item-subtitle">
          {path}
          {path ? "/" : ""}
          {name}
        </span>
        <span>{formatters.bytes(size)}, </span>
        <span>{formatters.datetime(uploaded)}, </span>
        <span>{uploadedBy.username}</span>
      </Link>

      <CtaDropdown
        expanded={ctaListExpanded}
        onToggle={() => {
          setCtaListExpanded(!ctaListExpanded);
        }}
      >
        <span className="dropdown-title">{display}</span>
        <button
          className="dropdown-item"
          onClick={(e) => {
            setCtaListExpanded(false);
            printModal.openModal(e);
          }}
        >
          <i className="icon-printer"></i>
          Print g-code
        </button>

        <a
          download
          className="dropdown-item"
          href={downloadUrl}
          onClick={(e) => {
            setCtaListExpanded(false);
          }}
        >
          <i className="icon-download"></i>
          Download G-code
        </a>

        <button
          className="dropdown-item text-secondary"
          onClick={(e) => {
            setCtaListExpanded(false);
            deleteModal.openModal(e);
          }}
        >
          <i className="icon-trash"></i>
          Delete g-code
        </button>
      </CtaDropdown>

      <printModal.Modal />
      <DeleteModal
        path={path}
        display={display}
        modal={deleteModal}
        onRowDelete={onRowDelete}
      />
    </div>
  );
};

class GcodeList extends React.Component {
  state = {
    printedOn: [],
  };

  componentDidMount() {
    const { printersLoaded, loadPrinters } = this.props;
    if (!printersLoaded) {
      loadPrinters();
    }
  }

  render() {
    const { printedOn } = this.state;
    const {
      match,
      getAvailablePrinters,
      gcodesList,
      loadGcodesPage,
      clearGcodesPages,
      deleteGcode,
      printGcode,
    } = this.props;

    return (
      <section className="content">
        <div className="container">
          <SetActiveOrganization />
          <h1 className="main-title">
            G-Codes
            <Link
              to={`/${match.params.orgid}/add-gcode`}
              className="btn btn-sm"
              id="btn-add_gcode"
            >
              + Upload a g-code
            </Link>
          </h1>
        </div>

        <Listing
          rowFactory={(g) => {
            return (
              <GcodeTableRow
                key={g.id}
                orguuid={match.params.orgid}
                {...g}
                printGcode={printGcode}
                downloadUrl={g.links[0].href}
                onSchedulePrint={(gcodeId, printerId) =>
                  printGcode(gcodeId, printerId).then((r) => {
                    printedOn.push(printerId);
                    this.setState({
                      printedOn: [].concat(printedOn),
                    });
                    return r;
                  })
                }
                availablePrinters={getAvailablePrinters(printedOn)}
                onRowDelete={() =>
                  deleteGcode(g.id).then(() => {
                    loadGcodesPage(
                      gcodesList.startWith,
                      gcodesList.orderBy,
                      gcodesList.filter,
                      gcodesList.limit,
                      gcodesList.fields
                    );
                  })
                }
              />
            );
          }}
          itemList={gcodesList}
          sortByColumns={["filename", "size", "uploaded"]}
          loadPage={loadGcodesPage}
          clearItemsPages={clearGcodesPages}
          fields={[
            "id",
            "name",
            "size",
            "uploadedBy",
            "links"
          ]}
        />
      </section>
    );
  }
}

export default connect(
  (state) => ({
    printersLoaded: state.printers.printersLoaded,
    gcodesList: state.gcodes.list,
    getAvailablePrinters: (without = []) =>
      state.printers.printers
        .filter((p) => p.status && p.status.state === "Operational")
        .filter((p) => p.client && p.client.connected)
        .filter((p) => p.client && p.client.access_level === "unlocked")
        .filter((p) => without.indexOf(p.id) === -1),
  }),
  (dispatch, ownProps) => ({
    loadPrinters: () =>
      dispatch(
        loadPrinters(ownProps.match.params.orgid, [
          "job",
          "status",
          "webcam",
          "lights",
        ])
      ),
    loadGcodesPage: (startWith, orderBy, filter, limit, fields) =>
      dispatch(
        getGcodesPage(
          ownProps.match.params.orgid,
          startWith,
          orderBy,
          filter,
          limit,
          fields
        )
      ),
    clearGcodesPages: () => dispatch(clearGcodesPages()),
    deleteGcode: (id) => dispatch(deleteGcode(ownProps.match.params.orgid, id)),
    printGcode: (id, printer) =>
      dispatch(addPrintJob(ownProps.match.params.orgid, id, printer)),
  })
)(GcodeList);
