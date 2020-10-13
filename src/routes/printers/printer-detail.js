import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import { Route, Switch, Redirect } from "react-router-dom";
import { RoutedTabs, NavTab } from "react-router-tabs";

import JobsTab from "../../components/tabs/printer/jobs-tab";
import ControlsTab from "../../components/tabs/printer/controls-tab";
import ConnectionTab from "../../components/tabs/printer/connection-tab";
import SettingsTab from "../../components/tabs/printer/settings-tab";
import Loader from "../../components/utils/loader";
import BusyButton from "../../components/utils/busy-button";
import { useMyModal } from "../../components/utils/modal";
import SetActiveOrganization from "../../components/gateways/set-active-organization";
import Progress from "../../components/printers/progress";
import WebcamStream from "../../components/printers/webcam-stream";
import PrinterState from "../../components/printers/printer-state";
import {
  PrinterProperties,
  PrinterProgress,
} from "../../components/printers/printer-data";

import {
  getJobsPage,
  clearJobsPages,
  loadPrinters,
  patchPrinter,
  setPrinterConnection,
  changeCurrentJob,
  changeLights,
  movePrinthead,
  changeFanState,
  changeMotorsState,
  extrude,
  setTemperature,
  startUpdate,
} from "../../actions";

const ChangeConnectionModal = ({
  onPrinterConnectionChanged,
  state,
  modal,
}) => {
  const printerTargetState = state === 'offline' ? "online" : "offline";

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
              onClick={(e) => {
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

const PrinterDetail = ({
  match,
  printer,
  loadPrinters,
  setPrinterConnection,
  changeCurrentJobState,
  patchPrinter,
  role,
  jobList,
  loadJobsPage,
  clearJobsPages,
  changeLights,
  movePrinthead,
  changeFanState,
  changeMotorsState,
  extrude,
  setTemperature,
  startUpdate,
}) => {
  const changeConnectionModal = useMyModal();
  const [printersLoaded, setPrintersLoaded] = useState(false);
  const [timer, setTimer] = useState(false);
  useEffect(() => {
    if (!printer) {
      loadPrinters().then(() => setPrintersLoaded(true));
    } else {
      setPrintersLoaded(true);
    }
  }, [printer, loadPrinters]);

  useEffect(
    () => {
      let timer = setInterval(() => {
        loadPrinters(); 
        setTimer(timer);
      }, 3000)
      return () => {
        clearInterval(timer);
      }
    }, [timer, loadPrinters]
  )

  if (!printersLoaded) {
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
          <WebcamStream printer={printer} orgId={match.params.orgid} />

          <Progress {...printer.job} />
        </div>

        <div className="printer-detail-name">
          <div className="container">
            <h1 className="main-title">{printer.name}</h1>
            <div className="printer-state">
              <PrinterState printer={printer} />{" "}
              {(printer.client && printer.client.octoprint && printer.client.octoprint.printer) &&
              [printer.client.octoprint.printer.length ? 
              (
                  <button
                    key={1}
                    className="btn btn-xs"
                    type="submit"
                    onClick={(e) => {
                      e.preventDefault();
                      changeConnectionModal.openModal(e);
                    }}
                  >
                    Connect
                  </button>
                ) : (
                  <button
                    key={2}
                    className="btn btn-xs"
                    type="submit"
                    onClick={(e) => {
                      e.preventDefault();
                      changeConnectionModal.openModal(e);
                    }}
                  >
                    Disconnect
                  </button>
                )]}
              {printer.client &&
                printer.client.pill_info &&
                printer.client.pill_info.update_available && (
                  <div className="printer-state-announcement">
                    An update is available for your Pill{" "}
                    <button
                      className="btn btn-sm"
                      type="submit"
                      onClick={(e) => {
                        e.preventDefault();
                        startUpdate();
                      }}
                    >
                      Update
                    </button>
                  </div>
                )}
            </div>
          </div>
        </div>

        <div className="printer-detail-meta">
          <div className="container">
            <ChangeConnectionModal
              modal={changeConnectionModal}
              state={(printer && printer.client && !printer.client.error && printer.client.octoprint.printer && printer.client.octoprint.printer.state) ? 'online' : 'offline'}
              onPrinterConnectionChanged={setPrinterConnection}
            />
            <dl className="dl-horizontal">
              <PrinterProgress printer={printer} />
              <PrinterProperties printer={printer} />
            </dl>
          </div>
        </div>

        <div className="printer-detail-controls">
          <RoutedTabs
            startPathWith={match.url}
            className="react-tabs__tab-list"
            tabClassName="react-tabs__tab"
            activeTabClassName="react-tabs__tab--selected"
          >
            <NavTab to="/tab-controls">Controls</NavTab>
            <NavTab to="/tab-jobs">Jobs</NavTab>
            <NavTab to="/tab-connection">Connection</NavTab>
            {role === "admin" && <NavTab to="/tab-settings">Settings</NavTab>}
          </RoutedTabs>

          <Switch>
            <Route
              exact
              path={`${match.url}`}
              render={() => (
                <Redirect replace to={`${match.url}/tab-controls`} />
              )}
            />
            <Route
              path={`${match.url}/tab-jobs`}
              render={(props) => (
                <JobsTab
                  orguuid={match.params.orgid}
                  jobList={printer.printjobs}
                  // loadJobsPage={loadJobsPage}
                  clearJobsPages={clearJobsPages}
                />
              )}
            />
            <Route
              path={`${match.url}/tab-controls`}
              render={(props) => (
                <ControlsTab
                  printer={printer}
                  temperatures={printer.status && printer.status.temperature}
                  movePrinthead={movePrinthead}
                  changeFanState={changeFanState}
                  changeMotorsState={changeMotorsState}
                  changeCurrentJobState={changeCurrentJobState}
                  changeLights={changeLights}
                  extrude={extrude}
                  setTemperature={setTemperature}
                />
              )}
            />
            <Route
              path={`${match.url}/tab-connection`}
              render={(props) => (
                <ConnectionTab printer={printer} startUpdate={startUpdate} />
              )}
            />
            <Route
              path={`${match.url}/tab-settings`}
              render={(props) => (
                <SettingsTab
                  printer={printer}
                  onPrinterSettingsChanged={patchPrinter}
                />
              )}
            />
          </Switch>
        </div>
      </div>
    </section>
  );
};

export default connect(
  (state, ownProps) => ({
    printer: state.printers.printers.find(
      (p) => p.id === ownProps.match.params.id
    ),
    role: state.me.activeOrganization && state.me.activeOrganization.role,
    jobList: state.printjobs[ownProps.match.params.id] || {
      pages: [],
      orderBy: "-started",
      filter: null,
      limit: 10,
    },
  }),
  (dispatch, ownProps) => ({
    loadPrinters: () =>
      dispatch(
        loadPrinters(
          ownProps.match.params.orgid,
          ["job", "status", "webcam", "lights", "client", "printjobs", "api_key"]
        )
      ),
    changeCurrentJobState: (action) =>
      dispatch(
        changeCurrentJob(
          ownProps.match.params.orgid,
          ownProps.match.params.id,
          action
        )
      ),
    patchPrinter: (data) =>
      dispatch(
        patchPrinter(
          ownProps.match.params.orgid,
          ownProps.match.params.id,
          data
        )
      ),
    setPrinterConnection: (state) =>
      dispatch(
        setPrinterConnection(
          ownProps.match.params.orgid,
          ownProps.match.params.id,
          state
        )
      ),
    loadJobsPage: (startWith, orderBy, filter, limit) =>
      dispatch(
        getJobsPage(
          ownProps.match.params.orgid,
          ownProps.match.params.id,
          startWith,
          orderBy,
          filter,
          limit
        )
      ),
    clearJobsPages: () =>
      dispatch(
        clearJobsPages(ownProps.match.params.orgid, ownProps.match.params.id)
      ),
    changeLights: () =>
      dispatch(
        changeLights(ownProps.match.params.orgid, ownProps.match.params.id)
      ),
    movePrinthead: (command, opts) =>
      dispatch(
        movePrinthead(
          ownProps.match.params.orgid,
          ownProps.match.params.id,
          command,
          opts
        )
      ),
    changeFanState: (targetState) =>
      dispatch(
        changeFanState(
          ownProps.match.params.orgid,
          ownProps.match.params.id,
          targetState
        )
      ),
    changeMotorsState: (targetState) =>
      dispatch(
        changeMotorsState(
          ownProps.match.params.orgid,
          ownProps.match.params.id,
          targetState
        )
      ),
    extrude: (amount) =>
      dispatch(
        extrude(ownProps.match.params.orgid, ownProps.match.params.id, amount)
      ),
    setTemperature: (partName, target) =>
      dispatch(
        setTemperature(
          ownProps.match.params.orgid,
          ownProps.match.params.id,
          partName,
          target
        )
      ),
    startUpdate: () =>
      dispatch(
        startUpdate(ownProps.match.params.orgid, ownProps.match.params.id)
      ),
  })
)(PrinterDetail);
