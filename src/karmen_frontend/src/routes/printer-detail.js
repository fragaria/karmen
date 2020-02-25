import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import { Link, Redirect } from "react-router-dom";

import Loader from "../components/utils/loader";
import BusyButton from "../components/utils/busy-button";
import { useMyModal } from "../components/utils/modal";
import Listing from "../components/listings/wrapper";
import Progress from "../components/printers/progress";
import WebcamStream from "../components/printers/webcam-stream";
import PrinterState from "../components/printers/printer-state";
import PrinterAuthorizationForm from "../components/printers/printer-authorization-form";
import {
  PrinterProperties,
  PrinterProgress,
  PrinterConnectionStatus
} from "../components/printers/printer-data";
import formatters from "../services/formatters";

import { getJobsPage, clearJobsPages } from "../actions/printjobs";
import {
  loadAndQueuePrinter,
  patchPrinter,
  setPrinterConnection,
  changeCurrentJob,
  setWebcamRefreshInterval
} from "../actions/printers";

const ChangeConnectionModal = ({
  onPrinterConnectionChanged,
  accessLevel,
  state,
  modal
}) => {
  const printerTargetState =
    accessLevel === "unlocked" &&
    (["Offline", "Closed"].indexOf(state) > -1 ||
      state.match(/printer is not/i))
      ? "online"
      : "offline";

  return (
    <>
      {modal.isOpen && (
        <modal.Modal>
          <h1 className="modal-title text-center">
            Change printer connection status to {printerTargetState}
          </h1>
          <h3 className="text-center">
            Are you sure? This might affect any current printer operation.
          </h3>

          <div className="cta-box text-center">
            <BusyButton
              className="btn btn-sm"
              type="submit"
              onClick={e => {
                e.preventDefault();
                onPrinterConnectionChanged(printerTargetState);
                modal.closeModal();
              }}
              busyChildren="Working..."
            >
              Yes, please
            </BusyButton>
            <button className="btn btn-plain" onClick={modal.closeModal}>
              Cancel
            </button>
          </div>
        </modal.Modal>
      )}
    </>
  );
};

const CancelPrintModal = ({ modal, onCurrentJobStateChange }) => {
  return (
    <>
      {modal.isOpen && (
        <modal.Modal>
          <h1 className="modal-title text-center">
            Are you sure? You are about to cancel the whole print!
          </h1>
          <div className="cta-box text-center">
            <button
              className="btn"
              onClick={() => {
                onCurrentJobStateChange("cancel").then(() => {
                  modal.closeModal();
                });
              }}
            >
              Cancel the print!
            </button>{" "}
            <button className="btn btn-plain" onClick={modal.closeModal}>
              Close
            </button>
          </div>
        </modal.Modal>
      )}
    </>
  );
};

const PrinterCurrentPrintControl = ({ printer, onCurrentJobStateChange }) => {
  const cancelPrintModal = useMyModal();

  if (
    !printer.status ||
    !printer.client ||
    ["Printing", "Paused"].indexOf(printer.status.state) === -1 ||
    printer.client.access_level !== "unlocked"
  ) {
    return <></>;
  }

  return (
    <div className="cta-box text-center">
      {printer.status.state === "Paused" ? (
        <button
          className="btn btn-sm"
          onClick={() => {
            onCurrentJobStateChange("resume");
          }}
        >
          Resume print
        </button>
      ) : (
        <button
          className="btn btn-sm"
          onClick={() => {
            onCurrentJobStateChange("pause");
          }}
        >
          Pause print
        </button>
      )}{" "}
      <button className="btn btn-sm" onClick={cancelPrintModal.openModal}>
        Cancel print
      </button>
      <CancelPrintModal
        modal={cancelPrintModal}
        printer={printer}
        onCurrentJobStateChange={onCurrentJobStateChange}
      />
    </div>
  );
};

class PrintJobRow extends React.Component {
  render() {
    const { gcode_data, started, username } = this.props;
    if (!gcode_data) {
      return <div className="list-item"></div>;
    }
    return (
      <div className="list-item">
        <div className="list-item-content">
          {gcode_data && gcode_data.available ? (
            <Link
              className="list-item-subtitle"
              to={`/gcodes/${gcode_data.uuid}`}
            >
              {gcode_data.filename}
            </Link>
          ) : (
            <span className="list-item-subtitle">{gcode_data.filename}</span>
          )}

          <small>
            {formatters.bytes(gcode_data.size)}
            {", "}
            {formatters.datetime(started)}
            {", "}
            {username}
          </small>
        </div>
      </div>
    );
  }
}

const PrinterDetail = ({
  printer,
  image,
  loadPrinter,
  setPrinterConnection,
  changeCurrentJobState,
  patchPrinter,
  role,
  jobList,
  loadJobsPage,
  clearJobsPages,
  setWebcamRefreshInterval
}) => {
  const changeConnectionModal = useMyModal();
  const [printerLoaded, setPrinterLoaded] = useState(false);
  useEffect(() => {
    if (!printer) {
      loadPrinter().then(() => {
        setPrinterLoaded(true);
      });
    } else {
      setPrinterLoaded(true);
    }
  }, [printer, loadPrinter]);

  if (!printerLoaded) {
    return (
      <div>
        <Loader />
      </div>
    );
  }

  if (!printer) {
    return <Redirect to="/page-404" />;
  }

  return (
    <section className="content">
      <div className="printer-detail">
        <div className="printer-detail-stream">
          <WebcamStream
            {...printer.webcam}
            isPrinting={printer.status && printer.status.state === "Printing"}
            image={image}
            setWebcamRefreshInterval={setWebcamRefreshInterval}
          />
          <Progress {...printer.job} />
        </div>

        <div className="printer-detail-meta">
          <div className="container">
            <h1 className="main-title">{printer.name}</h1>
            <PrinterState printer={printer} />{" "}
            {printer.client &&
              printer.client.access_level === "unlocked" &&
              (["Offline", "Closed"].indexOf(
                printer.status && printer.status.state
              ) > -1 || printer.status.state.match(/printer is not/i) ? (
                <button
                  className="btn btn-xs"
                  type="submit"
                  onClick={e => {
                    e.preventDefault();
                    changeConnectionModal.openModal(e);
                  }}
                >
                  Connect
                </button>
              ) : (
                <button
                  className="btn btn-xs"
                  type="submit"
                  onClick={e => {
                    e.preventDefault();
                    changeConnectionModal.openModal(e);
                  }}
                >
                  Disconnect
                </button>
              ))}
            <ChangeConnectionModal
              modal={changeConnectionModal}
              accessLevel={
                printer.client ? printer.client.access_level : undefined
              }
              state={printer.status ? printer.status.state : undefined}
              onPrinterConnectionChanged={setPrinterConnection}
            />
            {role === "admin" && (
              <PrinterAuthorizationForm
                printer={printer}
                onPrinterAuthorizationChanged={patchPrinter}
              />
            )}
            <dl className="dl-horizontal">
              <PrinterProgress printer={printer} />
              <PrinterProperties printer={printer} />
              <PrinterConnectionStatus printer={printer} />
            </dl>
            <PrinterCurrentPrintControl
              printer={printer}
              onCurrentJobStateChange={changeCurrentJobState}
            />
          </div>
        </div>

        <div className="printer-detail-jobs">
          <ul className="tabs-navigation">
            <li className="tab active">Jobs</li>
          </ul>
          <div className="tabs-content">
            <Listing
              enableFiltering={false}
              itemList={jobList}
              loadPage={loadJobsPage}
              rowFactory={j => {
                return <PrintJobRow key={j.uuid} {...j} />;
              }}
              sortByColumns={["started"]}
              clearItemsPages={clearJobsPages}
            />
          </div>

          {role === "admin" && (
            <div className="cta-box text-center">
              <Link to={`/printers/${printer.uuid}/settings`}>
                <button className="btn">Printer settings</button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default connect(
  (state, ownProps) => ({
    printer: state.printers.printers.find(
      p => p.uuid === ownProps.match.params.uuid
    ),
    image: state.printers.images[ownProps.match.params.uuid],
    role: state.users.me.activeOrganization.role,
    jobList: state.printjobs[ownProps.match.params.uuid] || {
      pages: [],
      orderBy: "-started",
      filter: null,
      limit: 10
    }
  }),
  (dispatch, ownProps) => ({
    loadPrinter: () =>
      dispatch(
        loadAndQueuePrinter(ownProps.match.params.uuid, [
          "job",
          "status",
          "webcam"
        ])
      ),
    changeCurrentJobState: action =>
      dispatch(changeCurrentJob(ownProps.match.params.uuid, action)),
    patchPrinter: data =>
      dispatch(patchPrinter(ownProps.match.params.uuid, data)),
    setPrinterConnection: state =>
      dispatch(setPrinterConnection(ownProps.match.params.uuid, state)),
    loadJobsPage: (startWith, orderBy, filter, limit) =>
      dispatch(
        getJobsPage(
          ownProps.match.params.uuid,
          startWith,
          orderBy,
          filter,
          limit
        )
      ),
    clearJobsPages: () => dispatch(clearJobsPages(ownProps.match.params.uuid)),
    setWebcamRefreshInterval: interval =>
      dispatch(setWebcamRefreshInterval(ownProps.match.params.uuid, interval))
  })
)(PrinterDetail);
