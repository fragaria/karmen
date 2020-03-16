import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import { Link, Redirect } from "react-router-dom";

import Loader from "../../components/utils/loader";
import BusyButton from "../../components/utils/busy-button";
import { useMyModal } from "../../components/utils/modal";
import SetActiveOrganization from "../../components/gateways/set-active-organization";
import Listing from "../../components/listings/wrapper";
import Progress from "../../components/printers/progress";
import WebcamStream from "../../components/printers/webcam-stream";
import PrinterState from "../../components/printers/printer-state";
import PrinterAuthorizationForm from "../../components/printers/printer-authorization-form";
import {
  PrinterProperties,
  PrinterProgress,
  PrinterConnectionStatus
} from "../../components/printers/printer-data";
import formatters from "../../services/formatters";

import { getJobsPage, clearJobsPages } from "../../actions/printjobs";
import {
  loadAndQueuePrinter,
  patchPrinter,
  setPrinterConnection,
  changeCurrentJob,
  changeLights
} from "../../actions/printers";
import { setWebcamRefreshInterval } from "../../actions/webcams";
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
    <>
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
      )}
      <button className="btn btn-sm" onClick={cancelPrintModal.openModal}>
        Cancel print
      </button>
      <CancelPrintModal
        modal={cancelPrintModal}
        onCurrentJobStateChange={onCurrentJobStateChange}
      />
    </>
  );
};

class PrintJobRow extends React.Component {
  render() {
    const { orguuid, gcode_data, started, username } = this.props;
    if (!gcode_data) {
      return <div className="list-item"></div>;
    }
    return (
      <div className="list-item">
        <div className="list-item-content">
          {gcode_data && gcode_data.available ? (
            <Link
              className="list-item-subtitle"
              to={`/${orguuid}/gcodes/${gcode_data.uuid}`}
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
  match,
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
  setWebcamRefreshInterval,
  changeLights,
  printerControl
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
        <SetActiveOrganization />
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
          <div className="cta-box text-center hidden-xs">
            <PrinterCurrentPrintControl
              printer={printer}
              onCurrentJobStateChange={changeCurrentJobState}
            />
            {printer.lights !== "unavailable" && (
              <BusyButton
                className="btn btn-sm"
                type="button"
                onClick={changeLights}
                busyChildren="Switching lights..."
              >
                {`Lights ${printer.lights === "on" ? "off" : "on"}`}
              </BusyButton>
            )}
          </div>
          <div className="cta-box text-center hidden-xs">
            <div className="printer-control-panel">
              <div style={{ gridColumn: 2, gridRow: 1 }}>X/Y</div>
              <div style={{ gridColumn: 2, gridRow: 2 }}>
                <BusyButton
                  className="btn btn-sm"
                  type="button"
                  onClick={printerControl}
                  busyChildren="..."
                >
                  <span className="icon-up1"></span>
                </BusyButton>
              </div>
              <div style={{ gridColumn: 1, gridRow: 3 }}>
                <BusyButton
                  className="btn btn-sm"
                  type="button"
                  onClick={printerControl}
                  busyChildren="..."
                >
                  <span className="icon-left"></span>
                </BusyButton>
              </div>
              <div style={{ gridColumn: 2, gridRow: 3 }}>
                <BusyButton
                  className="btn btn-sm"
                  type="button"
                  onClick={printerControl}
                  busyChildren="..."
                >
                  <span className="icon-home"></span>
                </BusyButton>
              </div>
              <div style={{ gridColumn: 3, gridRow: 3 }}>
                <BusyButton
                  className="btn btn-sm"
                  type="button"
                  onClick={printerControl}
                  busyChildren="..."
                >
                  <span className="icon-right"></span>
                </BusyButton>
              </div>

              <div style={{ gridColumn: 2, gridRow: 4 }}>
                <BusyButton
                  className="btn btn-sm"
                  type="button"
                  onClick={printerControl}
                  busyChildren="..."
                >
                  <span className="icon-down1"></span>
                </BusyButton>
              </div>

              <div style={{ gridColumn: 4, gridRow: 1 }}>Z</div>
              <div style={{ gridColumn: 4, gridRow: 2 }}>
                <BusyButton
                  className="btn btn-sm"
                  type="button"
                  onClick={printerControl}
                  busyChildren="..."
                >
                  <span className="icon-up1"></span>
                </BusyButton>
              </div>
              <div style={{ gridColumn: 4, gridRow: 3 }}>
                <BusyButton
                  className="btn btn-sm"
                  type="button"
                  onClick={printerControl}
                  busyChildren="..."
                >
                  <span className="icon-home"></span>
                </BusyButton>
              </div>
              <div style={{ gridColumn: 4, gridRow: 4 }}>
                <BusyButton
                  className="btn btn-sm"
                  type="button"
                  onClick={printerControl}
                  busyChildren="..."
                >
                  <span className="icon-down1"></span>
                </BusyButton>
              </div>

              <div
                style={{
                  gridColumn: 5,
                  gridRow: 1,
                  gridColumnEnd: 7,
                  height: 0
                }}
              >
                Extrude
              </div>
              <div
                style={{
                  gridColumn: 5,
                  gridRow: 2,
                  gridColumnEnd: 7,
                  height: 0
                }}
              >
                <BusyButton
                  className="btn btn-sm"
                  type="button"
                  onClick={printerControl}
                  busyChildren="..."
                >
                  <span className="icon-up1"></span>
                </BusyButton>
              </div>
              <div
                style={{
                  gridColumn: 5,
                  gridRow: 3,
                  gridColumnEnd: 7,
                  height: 0
                }}
              >
                <input style={{ maxWidth: 50 }} type="number" value="1" />
              </div>
              <div
                style={{
                  gridColumn: 5,
                  gridRow: 4,
                  gridColumnEnd: 7,
                  height: 0
                }}
              >
                <BusyButton
                  className="btn btn-sm"
                  type="button"
                  onClick={printerControl}
                  busyChildren="..."
                >
                  <span className="icon-down1"></span>
                </BusyButton>
              </div>

              <div style={{ gridColumn: 4, gridRow: 1 }}>Z</div>
              <div style={{ gridColumn: 4, gridRow: 2 }}>
                <BusyButton
                  className="btn btn-sm"
                  type="button"
                  onClick={printerControl}
                  busyChildren="..."
                >
                  <span className="icon-up1"></span>
                </BusyButton>
              </div>
              <div style={{ gridColumn: 4, gridRow: 3 }}>
                <BusyButton
                  className="btn btn-sm"
                  type="button"
                  onClick={printerControl}
                  busyChildren="..."
                >
                  <span className="icon-home"></span>
                </BusyButton>
              </div>
              <div style={{ gridColumn: 4, gridRow: 4 }}>
                <BusyButton
                  className="btn btn-sm"
                  type="button"
                  onClick={printerControl}
                  busyChildren="..."
                >
                  <span className="icon-down1"></span>
                </BusyButton>
              </div>

              <div style={{ gridColumn: 7, gridRow: 1 }}>Fan</div>
              <div style={{ gridColumn: 7, gridRow: 2 }}>
                <BusyButton
                  className="btn btn-sm"
                  type="button"
                  onClick={printerControl}
                  busyChildren="..."
                >
                  ON
                </BusyButton>
              </div>

              <div style={{ gridColumn: 7, gridRow: 4 }}>
                <BusyButton
                  className="btn btn-sm"
                  type="button"
                  onClick={printerControl}
                  busyChildren="..."
                >
                  OFF
                </BusyButton>
              </div>

              <div
                style={{
                  gridColumn: 1,
                  gridRow: 6,
                  gridColumnEnd: 4,
                  height: 0
                }}
              >
                <span>Bed temp</span>
              </div>
              <div
                style={{
                  gridColumn: 4,
                  gridRow: 6,
                  gridColumnEnd: 7,
                  height: 0
                }}
              >
                <input type="number" style={{ width: "100%" }} />
              </div>
              <div style={{ gridColumn: 7, gridRow: 6 }}>
                <BusyButton
                  className="btn btn-sm"
                  type="button"
                  onClick={printerControl}
                  busyChildren="..."
                >
                  SET
                </BusyButton>
              </div>

              <div
                style={{
                  gridColumn: 1,
                  gridRow: 7,
                  gridColumnEnd: 4,
                  height: 0
                }}
              >
                <span>Hotend temp</span>
              </div>
              <div
                style={{
                  gridColumn: 4,
                  gridRow: 7,
                  gridColumnEnd: 7,
                  height: 0
                }}
              >
                <input type="number" style={{ width: "100%" }} />
              </div>
              <div style={{ gridColumn: 7, gridRow: 7 }}>
                <BusyButton
                  className="btn btn-sm"
                  type="button"
                  onClick={printerControl}
                  busyChildren="..."
                >
                  SET
                </BusyButton>
              </div>
            </div>
          </div>
        </div>

        <div className="printer-detail-meta">
          <div className="container">
            <h1 className="main-title">{printer.name}</h1>
            <div className="printer-state">
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
            </div>
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
          </div>
        </div>

        <div className="cta-box text-center visible-xs">
          <PrinterCurrentPrintControl
            printer={printer}
            onCurrentJobStateChange={changeCurrentJobState}
          />
          {printer.lights !== "unavailable" && (
            <BusyButton
              className="btn btn-sm"
              type="button"
              onClick={changeLights}
              busyChildren="Switching lights..."
            >
              {`Lights ${printer.lights === "on" ? "off" : "on"}`}
            </BusyButton>
          )}
        </div>

        <div className="printer-detail-jobs">
          <div className="react-tabs__tab-list">
            <span className="react-tabs__tab react-tabs__tab--selected">
              Jobs
            </span>
          </div>

          <Listing
            enableFiltering={false}
            itemList={jobList}
            loadPage={loadJobsPage}
            rowFactory={j => {
              return (
                <PrintJobRow
                  key={j.uuid}
                  {...j}
                  orguuid={match.params.orguuid}
                />
              );
            }}
            sortByColumns={["started"]}
            clearItemsPages={clearJobsPages}
          />

          {role === "admin" && (
            <div className="cta-box text-center">
              <Link
                to={`/${match.params.orguuid}/printers/${printer.uuid}/settings`}
              >
                <button className="btn btn-outline">Printer settings</button>
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
    image: state.webcams.images[ownProps.match.params.uuid],
    role: state.me.activeOrganization.role,
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
        loadAndQueuePrinter(
          ownProps.match.params.orguuid,
          ownProps.match.params.uuid,
          ["job", "status", "webcam", "lights"]
        )
      ),
    changeCurrentJobState: action =>
      dispatch(
        changeCurrentJob(
          ownProps.match.params.orguuid,
          ownProps.match.params.uuid,
          action
        )
      ),
    patchPrinter: data =>
      dispatch(
        patchPrinter(
          ownProps.match.params.orguuid,
          ownProps.match.params.uuid,
          data
        )
      ),
    setPrinterConnection: state =>
      dispatch(
        setPrinterConnection(
          ownProps.match.params.orguuid,
          ownProps.match.params.uuid,
          state
        )
      ),
    loadJobsPage: (startWith, orderBy, filter, limit) =>
      dispatch(
        getJobsPage(
          ownProps.match.params.orguuid,
          ownProps.match.params.uuid,
          startWith,
          orderBy,
          filter,
          limit
        )
      ),
    clearJobsPages: () =>
      dispatch(
        clearJobsPages(
          ownProps.match.params.orguuid,
          ownProps.match.params.uuid
        )
      ),
    setWebcamRefreshInterval: interval =>
      dispatch(
        setWebcamRefreshInterval(
          ownProps.match.params.orguuid,
          ownProps.match.params.uuid,
          interval
        )
      ),
    changeLights: () =>
      dispatch(
        changeLights(ownProps.match.params.orguuid, ownProps.match.params.uuid)
      ),
    printerControl: () => function() {}
  })
)(PrinterDetail);
