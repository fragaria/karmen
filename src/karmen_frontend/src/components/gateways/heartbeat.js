import React from "react";

import { useMyModal } from "../utils/modal";
import { heartbeat } from "../../services/backend";

const NULL_EVENT = { currentTarget: true };

const OfflineModal = ({ shouldShow }) => {
  const { Modal, openModal, isOpen, closeModal } = useMyModal({
    hideClose: true,
  });
  if (shouldShow && !isOpen) {
    openModal(NULL_EVENT);
  }

  if (!shouldShow && isOpen) {
    closeModal(NULL_EVENT);
  }

  return (
    isOpen && (
      <Modal>
        <h1 className="modal-title text-center">Application is offline</h1>
        <p className="message-error">
          Karmen's API is not responding. Check your connection, please.
        </p>
        <div className="cta-box text-center"></div>
      </Modal>
    )
  );
};

const UpgradeModal = ({ shouldShow }) => {
  const { Modal, openModal, isOpen, closeModal } = useMyModal({
    hideClose: true,
  });
  if (shouldShow && !isOpen) {
    openModal(NULL_EVENT);
  }

  if (!shouldShow && isOpen) {
    closeModal(NULL_EVENT);
  }

  return (
    isOpen && (
      <Modal>
        <h1 className="modal-title text-center">
          Application has been upgraded
        </h1>
        <p className="message-success">
          There is a new version of the application. Upgrade now, please.
        </p>
        <p className="text-center">
          If the button does not work, try pressing <code>Ctrl+R</code> or{" "}
          <code>&#8984;+R</code>.
        </p>
        <div className="cta-box text-center">
          <button
            className="btn"
            onClick={() => {
              window.location.reload(true);
            }}
          >
            Upgrade
          </button>
        </div>
      </Modal>
    )
  );
};

class Heartbeat extends React.Component {
  state = {
    isOnline: true,
    shouldUpgrade: false,
    apiVersion: undefined,
    timer: null,
  };

  constructor(props) {
    super(props);
    this.checkBackend = this.checkBackend.bind(this);
  }

  checkBackend() {
    heartbeat().then((result) => {
      const { apiVersion } = this.state;
      this.setState({
        isOnline: result !== -1,
        apiVersion: result === -1 ? apiVersion : result,
        shouldUpgrade:
          result !== -1 &&
          ((result !== apiVersion && apiVersion !== undefined) ||
            [result, "@dev", `v${result}`].indexOf(
              process.env.REACT_APP_GIT_REV
            ) === -1),
        timer: setTimeout(this.checkBackend, 5000),
      });
    });
  }

  componentDidMount() {
    this.checkBackend();
  }

  componentWillUnmount() {
    const { timer } = this.state;
    if (timer) {
      clearTimeout(timer);
    }
  }

  render() {
    const { isOnline, shouldUpgrade } = this.state;

    return (
      <>
        <UpgradeModal shouldShow={shouldUpgrade} />
        <OfflineModal shouldShow={!isOnline} />
      </>
    );
  }
}

export default Heartbeat;
