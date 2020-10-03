import React from "react";
import { FormInputs } from "./form-utils";
import BusyButton from "../utils/busy-button";

class OrganizationEditForm extends React.Component {
  state = {
    initialized: false,
    message: null,
    messageOk: false,
    form: {
      name: {
        name: "Organization's name",
        val: "",
        type: "text",
        required: true,
      },
    },
  };

  constructor(props) {
    super(props);
    this.submit = this.submit.bind(this);
  }

  componentDidMount() {
    const { initialized, form } = this.state;
    const { defaults } = this.props;
    if (!initialized && defaults) {
      this.setState({
        initialized: true,
        form: Object.assign({}, form, {
          name: Object.assign({}, form.name, {
            val: defaults.name,
            error: null,
          }),
        }),
      });
    }
  }

  submit(e) {
    e.preventDefault();
    this.setState({
      messageOk: false,
      message: null,
    });
    const { form } = this.state;
    const { onSubmit } = this.props;
    if (!form.name.val) {
      this.setState({
        form: Object.assign({}, form, {
          name: Object.assign({}, form.name, {
            error: "Name cannot be empty",
          }),
        }),
      });
      return;
    }
    onSubmit({
      name: form.name.val,
    })
      .then((result) => {
        this.setState({
          message: result.message,
          messageOk: result.ok,
        });
      })
      .catch((e) => {
        this.setState({
          message: e.toString(),
          messageOk: false,
        });
      });
  }

  render() {
    const { message, messageOk, form } = this.state;
    const { onCancel } = this.props;
    const updateValue = (name, value, target) => {
      const { form } = this.state;
      this.setState({
        form: Object.assign({}, form, {
          [name]: Object.assign({}, form[name], { val: value, error: null }),
        }),
      });
    };
    return (
      <form>
        {message && (
          <p className={messageOk ? "message-success" : "message-error"}>
            {message}
          </p>
        )}
        <FormInputs definition={form} updateValue={updateValue} />
        <div className="cta-box text-center">
          <BusyButton
            className="btn"
            type="submit"
            onClick={this.submit}
            busyChildren="Saving..."
          >
            Save
          </BusyButton>{" "}
          <button className="btn btn-plain" type="reset" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </form>
    );
  }
}

export default OrganizationEditForm;
