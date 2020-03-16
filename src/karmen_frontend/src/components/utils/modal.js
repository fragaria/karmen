import React from "react";
import useModal from "use-react-modal";

export const useMyModal = ({ hideClose }) => {
  const { closeModal, isOpen, Modal, ...rest } = useModal({
    background: "rgba(0, 0, 0, 0.5)"
  });

  return {
    Modal: ({ children }) =>
      isOpen && (
        <Modal>
          <ModalWrapper closeFunc={closeModal} hideClose={hideClose}>
            {children}
          </ModalWrapper>
        </Modal>
      ),
    isOpen,
    closeModal,
    ...rest
  };
};

export const ModalWrapper = ({ closeFunc, hideClose, children }) => {
  return (
    <div className="modal-content">
      {!hideClose && (
        <button className="modal-close" onClick={closeFunc}>
          <span className="icon-close"></span>
        </button>
      )}
      {children}
    </div>
  );
};

export default ModalWrapper;
