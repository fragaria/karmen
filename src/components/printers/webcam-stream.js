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
              className={`webcam-modal-stream ${classNames
                .concat("pointer")
                .join(" ")}`}
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
  imageResponse,
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

  let image, status_code;
  if (imageResponse) {
    image = imageResponse[0];
    status_code = imageResponse[1];
  }
  // No response but printer online -> fresh page load
  // No response and printer is offline -> stream unavailable
  // 404 -> stream unavailable
  if (!image || status_code === 404) {
    const isStreamAvailable =
      printerUtils.isConnected(printer) && status_code !== 404;
    return (
      <>
        <div className={`webcam-stream unavailable`}>
          {isStreamAvailable ? (
            <div>Starting stream</div>
          ) : (
            <div>Stream unavailable</div>
          )}
        </div>
      </>
    );
  }
  // fetching was OK, we have an image to display
  if (image.startsWith("data:image/")) {
    return (
      <>
        <div className={`webcam-stream`}>
          <WebcamModal
            classNames={klass}
            source={image}
            url={url}
            allowFullscreen={allowFullscreen}
          />
        </div>
      </>
    );
  }
  // last fetch was probably something like 502, should start working soon
  return (
    <>
      <div className={`webcam-stream unavailable`}>
        <div>
          Unable to get stream.
          <br /> Retrying.
        </div>
      </div>
    </>
  );
};

export class WebcamStream extends React.Component {
  componentDidMount() {
    const { setWebcamRefreshInterval } = this.props;
    setWebcamRefreshInterval(window.env.SNAPSHOT_INTERVAL);
  }

  componentWillUnmount() {
    const { setWebcamRefreshInterval } = this.props;
    setWebcamRefreshInterval(-1);
  }

  render() {
    return (
      <WebcamStreamRenderer {...this.props} {...this.props.printer.webcam} />
    );
  }
}

export default connect(
  (state, ownProps) => ({
    imageResponse: state.webcams.images[ownProps.printer.id],
  }),
  (dispatch, ownProps) => ({
    setWebcamRefreshInterval: (interval) =>
      dispatch(
        setWebcamRefreshInterval(ownProps.orgId, ownProps.printer.id, interval)
      ),
  })
)(WebcamStream);
