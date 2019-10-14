import React from 'react';

const BACKEND_BASE_URL = window.env.BACKEND_BASE;

export class WebcamStream extends React.Component {
  state = {
    isOnline: false,
  }

  constructor(props) {
    super(props);
    this.testStream = this.testStream.bind(this);
  }

  testStream() {
    const { stream, proxied } = this.props;
    if (!stream && !proxied) {
      this.setState({
        isOnline: false,
      });
      return;
    }
    fetch(stream)
      .then((r) => {
        if (r.status === 200) {
          this.setState({
            isOnline: true,
            source: stream,
          });
        }
      }).catch((e) => {
        const proxiedStream = `${BACKEND_BASE_URL}${proxied}`;
        fetch(proxiedStream)
          .then((r) => {
            if (r.status === 200) {
              this.setState({
                isOnline: true,
                source: proxiedStream,
              });
            }
          }).catch((e) => {
            // pass
          });
      });
  }

  componentDidMount() {
    this.testStream();
  }

  componentDidUpdate(prevProps) {
    const { stream, proxied } = this.props;
    if (prevProps.stream !== stream || prevProps.proxied !== proxied) {
      this.testStream();
    }
  }

  componentWillUnmount() {
    this.setState({
      isOnline: false,
      source: null,
    })
  }

  render() {
    const { flipHorizontal, flipVertical, rotate90 } = this.props;
    const { isOnline, source } = this.state;
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

    return <div className="webcam-stream">
      {isOnline ?
        <img
          className={klass.join(' ')}
          alt={source}
          src={`${source}?t=${(new Date()).getTime()}`}
        /> :
        <p className="no-stream">
          Stream unavailable
        </p>
      }
    </div>;
  }
}