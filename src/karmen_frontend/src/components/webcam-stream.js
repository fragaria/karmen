import React from 'react';

// kudos to https://stackoverflow.com/a/50096215 and https://stackoverflow.com/a/49857905
function fetchWithTimeout(url, options, delay) {
   const timer = new Promise((resolve) => {
      setTimeout(resolve, delay, {
        timeout: true,
      });
   });
   return Promise.race([
      fetch(url, options),
      timer
   ]).then((response) => {
      if (response.timeout) { 
        Promise.reject(`Timeout reached for ${url}`);
      }
      return response;
   }).catch((e) => {
    Promise.reject(e);
   });
}

export class WebcamStream extends React.Component {
  state = {
    isOnline: false,
    isMaximized: false,
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
    fetchWithTimeout(stream, {}, 3000)
      .then((r) => {
        if (r.status === 200) {
          this.setState({
            isOnline: true,
            source: `${stream}?t=${(new Date()).getTime()}`,
          });
        } else {
          throw new Error(`Cannot work with stream on ${stream}`);
        }
      }).catch((e) => {
        fetchWithTimeout(proxied, {}, 3000)
          .then((r) => {
            if (r.status === 200) {
              this.setState({
                isOnline: true,
                source: `${proxied}?t=${(new Date()).getTime()}`,
              });
            }
          }).catch((e) => {
            throw new Error(`Cannot work with stream on ${proxied}`);
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
            alt={source}
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