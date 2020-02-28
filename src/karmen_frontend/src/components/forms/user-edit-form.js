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
      patchUserForm: {
        username: {
          name: "Username",
          val: props.username,
          type: "text",
          required: true
        },
        email: {
          name: "E-mail",
          val: props.email,
          type: "text",
          required: true,
          disabled: true
        }
      }
    };
    this.patchUser = this.patchUser.bind(this);
  }

  patchUser(e) {
    e.preventDefault();
    const { patchUserForm } = this.state;
    const { patchUser, username, email } = this.props;
    let hasError = false;
    // eslint-disable-next-line no-unused-vars
    for (let field of Object.values(patchUserForm)) {
      if (field.required && !field.val) {
        field.error = `${field.name} is required!`;
        hasError = true;
      } else {
        field.error = "";
      }
    }
    if (!isEmail(patchUserForm.email.val)) {
      hasError = true;
      patchUserForm.email.error = "That does not seem like an e-mail address";
    }
    if (hasError) {
      this.setState({
        patchUserForm: Object.assign({}, patchUserForm)
      });
      return;
    }
    return patchUser(patchUserForm.username.val, email).then(r => {
      if (r.status !== 200) {
        this.setState({
          messageOk: false,
          message: "Profile change unsuccessful, try again, please.",
          patchUserForm: Object.assign({}, patchUserForm, {
            username: Object.assign({}, patchUserForm.username, {
              val: username
            }),
            email: Object.assign({}, patchUserForm.email, {
              val: email
            })
          })
        });
      } else {
        this.setState({
          message: "Profile changed successfully.",
          messageOk: true
        });
      }
    });
  }

  render() {
    const { message, messageOk, patchUserForm } = this.state;
    const updateValue = (name, value) => {
      const { patchUserForm } = this.state;
      this.setState({
        message: "",
        messageOk: undefined,
        patchUserForm: Object.assign({}, patchUserForm, {
          [name]: Object.assign({}, patchUserForm[name], {
            val: value,
            error: null
          })
        })
      });
    };
    return (
      <form>
        {message && (
          <p className={messageOk ? "message-success" : "message-error"}>
            {message}
          </p>
        )}
        <FormInputs definition={patchUserForm} updateValue={updateValue} />
        <div className="cta-box text-center">
          <BusyButton
            className="btn"
            type="submit"
            onClick={this.patchUser}
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
