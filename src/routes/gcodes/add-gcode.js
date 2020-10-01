import React from "react";
import { connect } from "react-redux";
import { Redirect, Link } from "react-router-dom";
import { uploadGcode } from "../../actions";
import SetActiveOrganization from "../../components/gateways/set-active-organization";
import BusyButton from "../../components/utils/busy-button";
import { HttpError } from "../../errors";

class AddGcode extends React.Component {
  state = {
    toUpload: null,
    path: "",
    message: null,
    messageOk: false,
    gcodeId: null,
  };

  constructor(props) {
    super(props);
    this.addCode = this.addCode.bind(this);
  }

  addCode(e) {
    e.preventDefault();
    const { uploadGcode } = this.props;
    const { toUpload, path } = this.state;
    if (!toUpload) {
      this.setState({
        message: "You need to select a file!",
      });
      return;
    }
    this.setState({
      message: null,
      messageOk: false,
    });
    return uploadGcode(path, toUpload)
      .then((r) => {
        this.setState({
          message: "File uploaded",
          path: "",
          messageOk: true,
          redirect: true,
          gcodeId: r.data.id,
        });
      })
      .catch((err) => {
        if (err instanceof HttpError && err.response.status === 415) {
          return this.setState({
            message: "This does not seem like a G-Code file.",
          });
        }

        this.setState({
          message:
            "Your G-Code file couldn't be uploaded. If this problem persists, please contact our support.",
        });
      });
  }

  render() {
    const { message, messageOk, redirect, gcodeId } = this.state;
    const { match } = this.props;
    if (redirect) {
      return <Redirect to={`/${match.params.orgid}/gcodes/${gcodeId}`} />;
    }
    return (
      <>
        <SetActiveOrganization />
        <div className="content">
          <div className="container">
            <h1 className="main-title text-center">Add a G-Code</h1>

            <form>
              <div className="input-group">
                <label htmlFor="file">Select your gcode</label>
                <input
                  type="file"
                  name="file"
                  onChange={(e) => {
                    this.setState({
                      toUpload: e.target.files[0],
                    });
                  }}
                />
                <span></span>

                {/* 
                TODO: Remove or add support on backend
                <label htmlFor="path">Path (optional)</label>
                <input
                  type="text"
                  id="path"
                  name="path"
                  value={path}
                  onChange={(e) =>
                    this.setState({
                      path: e.target.value,
                    })
                  }
                />
                <span></span> */}
              </div>

              <div className="form-messages">
                {message && (
                  <p
                    className={messageOk ? "message-success" : "message-error"}
                  >
                    {message}
                  </p>
                )}
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
                <Link
                  to={`/${match.params.orgid}/gcodes`}
                  className="btn btn-plain"
                >
                  Cancel
                </Link>
              </div>
            </form>
          </div>
        </div>
      </>
    );
  }
}

export default connect(null, (dispatch, ownProps) => ({
  uploadGcode: (path, toUpload) =>
    dispatch(uploadGcode(ownProps.match.params.orgid, toUpload)),
}))(AddGcode);
