import React from 'react';
import { getWebcamSnapshot } from '../services/backend'

export class WebcamStream extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isOnline: false,
      isMaximized: false,
      timer: null,
      snapshotPromise: null,
    }
    this.getSnapshot = this.getSnapshot.bind(this);
  }

  getSnapshot() {
    const { url } = this.props;
    const { snapshotPromise } = this.state;
    if (snapshotPromise) {
      return;
    }
    const newSnapshotPromise = getWebcamSnapshot(url).then((r) => {
      if (r === 202) {
        this.setState({
          timer: setTimeout(this.getSnapshot, 1000),
          snapshotPromise: null,
        });
      } else if (r && r.prefix && r.data) {
        this.setState({
          isOnline: true,
          timer: setTimeout(this.getSnapshot, 1000 / 5), // 1000 / 5 = 5 FPS
          source: `${r.prefix}${r.data}`,
          snapshotPromise: null,
        });
      } else {
        this.setState({
          isOnline: false,
          timer: null,
          source: null,
          snapshotPromise: null,
        });
      }
    });
    this.setState({
      snapshotPromise: newSnapshotPromise,
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
      timer: null,
    });
  }

  render() {
    const { url, flipHorizontal, flipVertical, rotate90 } = this.props;
    const { isOnline, isMaximized, source } = this.state;
    let klass = [];
    if (flipHorizontal) {
      klass.push('flip-horizontal');
    }

    if (flipVertical) {
      klass.push('flip-vertical');
    }

    if (rotate90) {
      klass.push('rotate-90');
    }
    return <div
      className={`webcam-stream ${isMaximized ? 'maximized' : ''}`}
       onClick={() => {
        const { isMaximized } = this.state;
        this.setState({
          isMaximized: !isMaximized
        })
      }}
    >
      {isOnline
        ?
          <img
            className={klass.join(' ')}
            alt={`Current state from ${url}`}
            src={source}
          />
        :
          <p className="no-stream">
            Stream unavailable
          </p>
      }
    </div>;
  }
}