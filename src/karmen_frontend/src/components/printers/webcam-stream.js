import React from "react";
import useModal from "use-react-modal";
// import { useMyModal } from "../../components/utils/modal";

const WebcamModal = ({ classNames, source, url }) => {
  const { closeModal, isOpen, Modal, openModal } = useModal({
    background: "rgba(0, 0, 0, .95)"
  });

  return (
    <>
      <img
        className={classNames.join(" ")}
        alt={`Current state from ${url}`}
        src={source}
        onClick={openModal}
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
  )
}

class WebcamStream extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isOnline: true,
      timer: null,
      snapshotPromise: null
    };
    this.getSnapshot = this.getSnapshot.bind(this);
  }

  getSnapshot() {
    const { url, getWebcamSnapshot } = this.props;
    const { isOnline, snapshotPromise } = this.state;
    if (snapshotPromise || !isOnline) {
      return;
    }
    const newSnapshotPromise = getWebcamSnapshot(url).then(r => {
      if (r.status === 202) {
        this.setState({
          timer: setTimeout(this.getSnapshot, 1000),
          snapshotPromise: null
        });
      } else if (r.data && r.data.prefix && r.data.data) {
        this.setState({
          isOnline: true,
          timer: setTimeout(this.getSnapshot, 1000 / 5), // 1000 / 5 = 5 FPS
          source: `${r.data.prefix}${r.data.data}`,
          snapshotPromise: null
        });
      } else {
        this.setState({
          isOnline: false,
          timer: null,
          source: null,
          snapshotPromise: null
        });
      }
    });
    this.setState({
      snapshotPromise: newSnapshotPromise
    });
  }

  componentDidMount() {
    this.getSnapshot();
  }

  componentWillUnmount() {
    const { timer } = this.state;
    timer && clearTimeout(timer);
    this.setState({
      isOnline: false,
      source: null,
      timer: null
    });
  }

  render() {
    const { url, flipHorizontal, flipVertical, rotate90 } = this.props;
    const { isOnline, source } = this.state;
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
        <div
          className={`webcam-stream ${isOnline && source ? "" : "unavailable"}`}
        >
          {isOnline && source ? (
            <WebcamModal
              classNames={klass}
              source={source}
              url={url}
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
