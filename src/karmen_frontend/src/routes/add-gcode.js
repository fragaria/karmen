import React from "react";
import { Redirect } from "react-router-dom";

import { BackLink } from "../components/back";
import { uploadGcode } from "../services/backend";
import BusyButton from "../components/busy-button";

class AddGcode extends React.Component {
  state = {
    toUpload: null,
    path: "",
    message: null,
    messageOk: false,
    gcodeId: null
  };

  constructor(props) {
    super(props);
    this.addCode = this.addCode.bind(this);
  }

  addCode(e) {
    e.preventDefault();
    const { toUpload, path } = this.state;
    if (!toUpload) {
      this.setState({
        message: "You need to select a file!"
      });
      return;
    }
    this.setState({
      message: null,
      messageOk: false
    });
    return uploadGcode(path, toUpload).then(r => {
      switch (r.status) {
        case 201:
          this.setState({
            message: "File uploaded",
            path: "",
            messageOk: true,
            redirect: true,
            gcodeId: r.data.id
          });
          break;
        case 415:
          this.setState({
            message: "This does not seem like a G-Code file."
          });
          break;
        default:
          this.setState({
            message: "Cannot upload G-Code, check server logs"
          });
      }
    });
  }

  render() {
    const { message, messageOk, redirect, path, gcodeId } = this.state;
    if (redirect) {
      return <Redirect to={`/gcodes/${gcodeId}`} />;
    }
    return (
      <div className="content">
        <div className="container">
          <h1 className="main-title text-center">Add a G-Code</h1>

          <form>
            {message && (
              <p className={messageOk ? "message-success" : "message-error"}>
                {message}
              </p>
            )}
            <div className="input-group">
              <label htmlFor="file">Select your gcode</label>
              <input
                type="file"
                name="file"
                onChange={e => {
                  this.setState({
                    toUpload: e.target.files[0]
                  });
                }}
              />
              <span></span>

              <label htmlFor="path">Path (optional)</label>
              <input
                type="text"
                id="path"
                name="path"
                value={path}
                onChange={e =>
                  this.setState({
                    path: e.target.value
                  })
                }
              />
              <span></span>
            </div>
            <div className="cta-box text-center">
              <BusyButton
                className="btn"
                type="submit"
                onClick={this.addCode}
                busyChildren="Uploading..."
              >
                Upload G-Code
              </BusyButton>{" "}
              {/* TODO this should actually work as a cancel button and cancel the upload if in progress */}
              <BackLink to="/gcodes" />
            </div>
          </form>
        </div>
      </div>
    );
  }
}

export default AddGcode;
