import React from "react";
import useModal from "use-react-modal";

export const useMyModal = () => {
  const { closeModal, isOpen, Modal, ...rest } = useModal({
    background: "rgba(0, 0, 0, 0.5)"
  });

  return {
    Modal: ({ children }) =>
      isOpen && (
        <Modal>
          <ModalWrapper closeFunc={closeModal}>{children}</ModalWrapper>
        </Modal>
      ),
    isOpen,
    closeModal,
    ...rest
  };
};

export const ModalWrapper = ({ closeFunc, children }) => {
  return (
    <>
      <div className="modal-content">
        <button className="modal-close" onClick={closeFunc}>
          <span className="icon-close"></span>
        </button>
        {children}
      </div>
    </>
  );
};

export default ModalWrapper;
