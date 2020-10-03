import React from "react";
import { FormInputs } from "../forms/form-utils";
import BusyButton from "../utils/busy-button";

class ChangePasswordForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      message: null,
      messageOk: false,
      changePwdForm: {
        password: {
          name: "Password",
          val: "",
          type: "password",
          required: true,
        },
        new_password: {
          name: "New password",
          val: "",
          type: "password",
          required: true,
        },
        new_password_confirmation: {
          name: "New password confirmation",
          val: "",
          type: "password",
          required: true,
        },
      },
    };
    this.changePwd = this.changePwd.bind(this);
  }

  changePwd(e) {
    e.preventDefault();
    const { changePwdForm } = this.state;
    const { changePassword } = this.props;
    let hasError = false;
    // eslint-disable-next-line no-unused-vars
    for (let field of Object.values(changePwdForm)) {
      if (field.required && !field.val) {
        field.error = `${field.name} is required!`;
        hasError = true;
      } else {
        field.error = "";
      }
    }
    if (changePwdForm.new_password.val) {
      if (
        changePwdForm.new_password.val !==
        changePwdForm.new_password_confirmation.val
      ) {
        changePwdForm.new_password.error = "New passwords do not match!";
        hasError = true;
      } else {
        changePwdForm.new_password.error = "";
      }
    }
    if (hasError) {
      this.setState({
        changePwdForm: Object.assign({}, changePwdForm),
      });
      return;
    }
    return changePassword(
      changePwdForm.password.val,
      changePwdForm.new_password.val,
      changePwdForm.new_password_confirmation.val
    )
      .then((r) => {
        this.setState({
          message: "Password changed successfully.",
          messageOk: true,
          changePwdForm: Object.assign({}, changePwdForm, {
            password: Object.assign({}, changePwdForm.password, {
              val: "",
            }),
            new_password: Object.assign({}, changePwdForm.new_password, {
              val: "",
            }),
            new_password_confirmation: Object.assign(
              {},
              changePwdForm.new_password_confirmation,
              { val: "" }
            ),
          }),
        });
      })
      .catch(() => {
        this.setState({
          messageOk: false,
          message: "Password change unsuccessful, try again, please.",
          changePwdForm: Object.assign({}, changePwdForm, {
            password: Object.assign({}, changePwdForm.password, { val: "" }),
            new_password: Object.assign({}, changePwdForm.new_password, {
              val: "",
            }),
            new_password_confirmation: Object.assign(
              {},
              changePwdForm.new_password_confirmation,
              { val: "" }
            ),
          }),
        });
      });
  }

  render() {
    const { message, messageOk, changePwdForm } = this.state;
    const updateValue = (name, value, target) => {
      const { changePwdForm } = this.state;
      this.setState({
        message: "",
        messageOk: undefined,
        changePwdForm: Object.assign({}, changePwdForm, {
          [name]: Object.assign({}, changePwdForm[name], {
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
        <FormInputs definition={changePwdForm} updateValue={updateValue} />
        <div className="cta-box text-center">
          <BusyButton
            className="btn"
            type="submit"
            onClick={this.changePwd}
            busyChildren="Changing password..."
          >
            Change password
          </BusyButton>
        </div>
      </form>
    );
  }
}

export default ChangePasswordForm;
