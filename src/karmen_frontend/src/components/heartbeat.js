import React from 'react';

import { heartbeat } from '../services/backend';

class Heartbeat extends React.Component {
  state = {
    isOnline: true,
    timer: null,
  }

  constructor(props) {
    super(props);
    this.checkBackend = this.checkBackend.bind(this);
  }

  checkBackend() {
    heartbeat().then((result) => {
      this.setState({
        isOnline: result,
        timer: setTimeout(this.checkBackend, 5000),
      });
    });
  }

  componentDidMount() {
    this.checkBackend();
  }

  componentWillUnmount() {
    const { timer } = this.state;
    if (timer) {
      clearTimeout(timer);
    }
  }

  render() {
    const { isOnline } = this.state;
    if (!isOnline) {
      return (<p className="heartbeat">Karmen's local API is not responding. Check the server logs, please.</p>);
    }
    return null;
  }
}

export default Heartbeat;