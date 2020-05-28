import React from "react";
import { FormInputs } from "../forms/form-utils";
import BusyButton from "../utils/busy-button";
import { isEmail } from "../../services/validators";

class UserEditForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      message: null,
      messageOk: false,
      patchMeForm: {
        username: {
          name: "Username",
          val: props.username,
          type: "text",
          required: true,
        },
        email: {
          name: "Email",
          val: props.email,
          type: "text",
          required: true,
          disabled: true,
        },
      },
    };
    this.patchMe = this.patchMe.bind(this);
  }

  patchMe(e) {
    e.preventDefault();
    const { patchMeForm } = this.state;
    const { patchMe, username, email } = this.props;
    let hasError = false;
    // eslint-disable-next-line no-unused-vars
    for (let field of Object.values(patchMeForm)) {
      if (field.required && !field.val) {
        field.error = `${field.name} is required!`;
        hasError = true;
      } else {
        field.error = "";
      }
    }
    if (!isEmail(patchMeForm.email.val)) {
      hasError = true;
      patchMeForm.email.error = "That does not seem like an email address";
    }
    if (hasError) {
      this.setState({
        patchMeForm: Object.assign({}, patchMeForm),
      });
      return;
    }
    return patchMe(patchMeForm.username.val, email)
      .then((r) => {
        this.setState({
          messageOk: false,
          message: "Profile change unsuccessful, try again, please.",
          patchMeForm: Object.assign({}, patchMeForm, {
            username: Object.assign({}, patchMeForm.username, {
              val: username,
            }),
            email: Object.assign({}, patchMeForm.email, {
              val: email,
            }),
          }),
        });
      })
      .catch((err) => {
        this.setState({
          message: "Profile changed successfully.",
          messageOk: true,
        });
      });
  }

  render() {
    const { message, messageOk, patchMeForm } = this.state;
    const updateValue = (name, value) => {
      const { patchMeForm } = this.state;
      this.setState({
        message: "",
        messageOk: undefined,
        patchMeForm: Object.assign({}, patchMeForm, {
          [name]: Object.assign({}, patchMeForm[name], {
            val: value,
            error: null,
          }),
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
        <FormInputs definition={patchMeForm} updateValue={updateValue} />
        <div className="cta-box text-center">
          <BusyButton
            className="btn"
            type="submit"
            onClick={this.patchMe}
            busyChildren="Changing profile..."
          >
            Change profile
          </BusyButton>
        </div>
      </form>
    );
  }
}

export default UserEditForm;
