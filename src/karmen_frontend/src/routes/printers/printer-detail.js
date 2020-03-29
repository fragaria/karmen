import React, { useState, useEffect } from "react";
import { connect } from "react-redux";
import { Route, Switch, Redirect } from "react-router-dom";
import { RoutedTabs, NavTab } from "react-router-tabs";

import JobsTab from "../../components/tabs/printer/jobs-tab";
import ControlsTab from "../../components/tabs/printer/controls-tab";
import ConnectionTab from "../../components/tabs/printer/connection-tab";
import Loader from "../../components/utils/loader";
import BusyButton from "../../components/utils/busy-button";
import { useMyModal } from "../../components/utils/modal";
import SetActiveOrganization from "../../components/gateways/set-active-organization";
import Progress from "../../components/printers/progress";
import WebcamStream from "../../components/printers/webcam-stream";
import PrinterState from "../../components/printers/printer-state";
import PrinterAuthorizationForm from "../../components/printers/printer-authorization-form";
import {
  PrinterProperties,
  PrinterProgress,
} from "../../components/printers/printer-data";

import {
  getJobsPage,
  clearJobsPages,
  loadAndQueuePrinter,
  patchPrinter,
  setPrinterConnection,
  changeCurrentJob,
  changeLights,
  movePrinthead,
  changeFanState,
  changeMotorsState,
  extrude,
  setTemperature,
} from "../../actions";

const ChangeConnectionModal = ({
  onPrinterConnectionChanged,
  accessLevel,
  state,
  modal,
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
  loadPrinter,
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
            isPrinting={printer.status && printer.status.state === "Printing"}
            printerUuid={printer.uuid}
            orgUuid={match.params.orguuid}
          />
          <Progress {...printer.job} />
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
                    onClick={(e) => {
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
                    onClick={(e) => {
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
            </dl>
            <a href={'/api/organizations/'+printer.organization_uuid+'/printers/'+printer.uuid+'/proxy/'}>Web control proxy</a>
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
            {role === "admin" && <NavTab to={`/settings`}>Settings</NavTab>}
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
                  orguuid={match.params.orguuid}
                  jobList={jobList}
                  loadJobsPage={loadJobsPage}
                  clearJobsPages={clearJobsPages}
                />
              )}
            />
            <Route
              path={`${match.url}/tab-controls`}
              render={(props) => (
                <ControlsTab
                  printer={printer}
                  available={
                    !(
                      printer.client.access_level === "unlocked" &&
                      (["Offline", "Closed"].indexOf(
                        printer.status && printer.status.state
                      ) > -1 ||
                        printer.status.state.match(/printer is not/i))
                    )
                  }
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
              render={(props) => <ConnectionTab printer={printer} />}
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
      (p) => p.uuid === ownProps.match.params.uuid
    ),
    role: state.me.activeOrganization.role,
    jobList: state.printjobs[ownProps.match.params.uuid] || {
      pages: [],
      orderBy: "-started",
      filter: null,
      limit: 10,
    },
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
    changeCurrentJobState: (action) =>
      dispatch(
        changeCurrentJob(
          ownProps.match.params.orguuid,
          ownProps.match.params.uuid,
          action
        )
      ),
    patchPrinter: (data) =>
      dispatch(
        patchPrinter(
          ownProps.match.params.orguuid,
          ownProps.match.params.uuid,
          data
        )
      ),
    setPrinterConnection: (state) =>
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
    changeLights: () =>
      dispatch(
        changeLights(ownProps.match.params.orguuid, ownProps.match.params.uuid)
      ),
    movePrinthead: (command, opts) =>
      dispatch(
        movePrinthead(
          ownProps.match.params.orguuid,
          ownProps.match.params.uuid,
          command,
          opts
        )
      ),
    changeFanState: (targetState) =>
      dispatch(
        changeFanState(
          ownProps.match.params.orguuid,
          ownProps.match.params.uuid,
          targetState
        )
      ),
    changeMotorsState: (targetState) =>
      dispatch(
        changeMotorsState(
          ownProps.match.params.orguuid,
          ownProps.match.params.uuid,
          targetState
        )
      ),
    extrude: (amount) =>
      dispatch(
        extrude(
          ownProps.match.params.orguuid,
          ownProps.match.params.uuid,
          amount
        )
      ),
    setTemperature: (partName, target) =>
      dispatch(
        setTemperature(
          ownProps.match.params.orguuid,
          ownProps.match.params.uuid,
          partName,
          target
        )
      ),
  })
)(PrinterDetail);
