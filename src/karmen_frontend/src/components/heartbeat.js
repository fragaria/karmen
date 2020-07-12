import React, { useCallback, useEffect } from "react";
import { connect } from "react-redux";

import { heartbeat } from "../actions/hearbeat";
import { useMyModal } from "./utils/modal";
import { useRecursiveTimeout } from "../hooks";

const NULL_EVENT = { currentTarget: true };

const OfflineModal = ({ shouldShow, isMaintenance }) => {
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
          {isMaintenance
            ? "Karmen is under maintenance, please try again later."
            : "Karmen's API is not responding. Check your connection, please."}
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
          Karmen has been updated, please reload the page to continue working.
        </h1>
        <div className="cta-box text-center">
          <button
            className="btn"
            onClick={() => {
              window.location.reload(true);
            }}
          >
            Reload now
          </button>

          <small className="text-center">
            If the button does not work,
            <br /> try pressing <code>Ctrl+R</code> or <code>&#8984;+R</code>.
          </small>
        </div>
      </Modal>
    )
  );
};

export const Heartbeat = ({
  checkBeat,
  isOnline,
  shouldUpgrade,
  isMaintenance,
}) => {
  const doCheck = useCallback(() => {
    return checkBeat().catch((err) => {
      // No need to panic, we're just offline.
    });
  }, [checkBeat]);

  // Fire first check right away.
  useEffect(() => {
    doCheck();
  }, [doCheck]);

  // ... enqueue subsecutive runs.
  useRecursiveTimeout(doCheck, 5000);

  return (
    <>
      <UpgradeModal shouldShow={shouldUpgrade} />
      <OfflineModal shouldShow={!isOnline} isMaintenance={isMaintenance} />
    </>
  );
};

export default connect(
  (state) => ({
    isOnline: state.heartbeat.isOnline,
    isMaintenance: state.heartbeat.isMaintenance,
    shouldUpgrade: state.heartbeat.shouldUpgrade,
  }),
  (dispatch) => ({
    checkBeat() {
      return dispatch(heartbeat());
    },
  })
)(Heartbeat);
