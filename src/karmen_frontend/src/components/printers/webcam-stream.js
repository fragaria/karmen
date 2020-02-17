import React from "react";
import useModal from "use-react-modal";

const WebcamModal = ({ classNames, source, url, allowFullscreen }) => {
  const { closeModal, isOpen, Modal, openModal } = useModal({
    background: "rgba(0, 0, 0, .95)"
  });

  return (
    <>
      <img
        className={classNames.join(" ")}
        alt={`Current state from ${url}`}
        src={source}
        onClick={e => {
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

class WebcamStream extends React.Component {
  state = {
    isPrinting: false
  };

  componentDidMount() {
    const { setWebcamRefreshInterval, isPrinting } = this.props;
    this.setState({
      isPrinting
    });
    setWebcamRefreshInterval(isPrinting ? 1000 / 5 : 5000);
  }

  static getDerivedStateFromProps(nextProps, prevState) {
    if (nextProps.isPrinting !== prevState.isPrinting) {
      nextProps.setWebcamRefreshInterval(
        nextProps.isPrinting ? 1000 / 5 : 5000
      );
    }
    return {
      isPrinting: nextProps.isPrinting
    };
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
      allowFullscreen
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
    return (
      <>
        <div className={`webcam-stream ${image ? "" : "unavailable"}`}>
          {image ? (
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
  }
}

export default WebcamStream;
