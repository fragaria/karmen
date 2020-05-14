import React from "react";
import { connect } from "react-redux";
import useModal from "use-react-modal";
import { setWebcamRefreshInterval } from "../../actions";

const WebcamModal = ({ classNames, source, url, allowFullscreen }) => {
  const { closeModal, isOpen, Modal, openModal } = useModal({
    background: "rgba(0, 0, 0, .95)",
  });

  return (
    <>
      <div
        className={"webcam-stream-image " + classNames.join(" ")}
        style={{ backgroundImage: `url(${source})` }}
        title={`Current state from ${url}`}
        onClick={(e) => {
          if (allowFullscreen !== false) {
            openModal(e);
          }
        }}
      ></div>
      {isOpen && (
        <Modal>
          <div className="webcam-modal">
            <button className="modal-close" onClick={closeModal}>
              <span className="icon-close"></span>
            </button>
            <div
              className="webcam-modal-stream"
              style={{ backgroundImage: `url(${source})` }}
              onClick={closeModal}
            ></div>
          </div>
        </Modal>
      )}
    </>
  );
};

export class WebcamStream extends React.Component {
  componentDidMount() {
    const { setWebcamRefreshInterval } = this.props;
    setWebcamRefreshInterval(200);
  }

  componentWillUnmount() {
    const { setWebcamRefreshInterval } = this.props;
    setWebcamRefreshInterval(-1);
  }

  render() {
    const {
      url,
      image,
      flipHorizontal,
      flipVertical,
      rotate90,
      allowFullscreen,
      printer,
    } = this.props;
    let klass = [];
    if (flipHorizontal) {
      klass.push("flip-horizontal");
    }

    if (flipVertical) {
      klass.push("flip-vertical");
    }

    if (rotate90) {
      klass.push("rotate-90");
    }
    const isStreamAvailable =
      image && printer.client && printer.client.connected;
    return (
      <>
        <div
          className={`webcam-stream ${isStreamAvailable ? "" : "unavailable"}`}
        >
          {isStreamAvailable ? (
            <WebcamModal
              classNames={klass}
              source={image}
              url={url}
              allowFullscreen={allowFullscreen}
            />
          ) : (
            <div className="webcam-stream-image">
              <span>Stream unavailable</span>
            </div>
          )}
        </div>
      </>
    );
  }
}

export default connect(
  (state, ownProps) => ({
    printer: state.printers.printers.find(
      (p) => p.uuid === ownProps.printerUuid
    ),
    image: state.webcams.images[ownProps.printerUuid],
  }),
  (dispatch, ownProps) => ({
    setWebcamRefreshInterval: (interval) =>
      dispatch(
        setWebcamRefreshInterval(
          ownProps.orgUuid,
          ownProps.printerUuid,
          interval
        )
      ),
  })
)(WebcamStream);
