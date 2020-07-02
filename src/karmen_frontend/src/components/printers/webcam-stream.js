import React from "react";
import { connect } from "react-redux";
import useModal from "use-react-modal";
import { setWebcamRefreshInterval } from "../../actions";
import * as printerUtils from "./utils";

const WebcamModal = ({ classNames, source, url, allowFullscreen }) => {
  const { closeModal, isOpen, Modal, openModal } = useModal({
    background: "rgba(0, 0, 0, .95)",
  });

  return (
    <>
      <img
        className={classNames.concat("pointer").join(" ")}
        alt={`Last screenshot from ${url}`}
        src={source}
        onClick={(e) => {
          if (allowFullscreen !== false) {
            openModal(e);
          }
        }}
      />

      {isOpen && (
        <Modal>
          <div className="webcam-modal">
            <button className="modal-close" onClick={closeModal}>
              <span className="icon-close"></span>
            </button>
            <div
              className={`webcam-modal-stream ${classNames.concat("pointer").join(" ")}`}
              style={{ backgroundImage: `url(${source})` }}
              onClick={closeModal}
            ></div>
          </div>
        </Modal>
      )}
    </>
  );
};

export const WebcamStreamRenderer = ({
  url,
  image,
  flipHorizontal,
  flipVertical,
  rotate90,
  allowFullscreen,
  printer,
}) => {
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
  const isStreamAvailable = image && printerUtils.isConnected(printer);
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
          <div>Stream unavailable</div>
        )}
      </div>
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
    return <WebcamStreamRenderer {...this.props} {...this.props.printer.webcam} />;
  }
}

export default connect(
  (state, ownProps) => ({
    image: state.webcams.images[ownProps.printer.uuid],
  }),
  (dispatch, ownProps) => ({
    setWebcamRefreshInterval: (interval) =>
      dispatch(
        setWebcamRefreshInterval(
          ownProps.orgUuid,
          ownProps.printer.uuid,
          interval
        )
      ),
  })
)(WebcamStream);
