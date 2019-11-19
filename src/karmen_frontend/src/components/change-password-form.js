import React from 'react';
import { connect } from 'react-redux';
import { changePassword } from '../actions/users';
import { FormInputs } from '../components/form-utils';

class ChangePasswordForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      submitting: false,
      message: null,
      messageOk: false,
      changePwdForm: {
        password: {
          name: "Password",
          val: '',
          type: 'password',
          required: true,
        },
        new_password: {
          name: "New password",
          val: '',
          type: 'password',
          required: true,
        },
        new_password_confirmation: {
          name: "New password confirmation",
          val: '',
          type: 'password',
          required: true,
        },
      }
    }
    this.changePwd = this.changePwd.bind(this);
  }

  changePwd(e) {
    e.preventDefault();
    const { changePwdForm } = this.state;
    const { onUserStateChanged, doChangePassword } = this.props;
    let hasError = false;
    // eslint-disable-next-line no-unused-vars
    for(let field of Object.values(changePwdForm)) {
      if (field.required && !field.val) {
        field.error = `${field.name} is required!`;
        hasError = true;
      } else {
        field.error = "";
      }
    }
    if (changePwdForm.new_password.val) {
      if (changePwdForm.new_password.val !== changePwdForm.new_password_confirmation.val) {
        changePwdForm.new_password.error = "New passwords do not match!";
        hasError = true;
      } else {
        changePwdForm.new_password.error = "";
      }
    }
    if (hasError) {
      this.setState({
        changePwdForm: Object.assign({}, changePwdForm),
      })
      return;
    }
    this.setState({
      submitting: true,
    });
    doChangePassword(changePwdForm.password.val, changePwdForm.new_password.val, changePwdForm.new_password_confirmation.val)
      .then(async (code) => {
        if (code !== 200) {
          this.setState({
            messageOk: false,
            message: "Password change unsuccessful, try again, please.",
            submitting: false,
            changePwdForm: Object.assign({}, changePwdForm, {
              password: Object.assign({}, changePwdForm.password, { val: '' }),
              new_password: Object.assign({}, changePwdForm.new_password, { val: '' }),
              new_password_confirmation: Object.assign({}, changePwdForm.new_password_confirmation, { val: '' }),
            })
          });
        } else {
          onUserStateChanged().then(() => {
            this.setState({
              submitting: false,
              message: "Password changed successfully.",
              messageOk: true,
              changePwdForm: Object.assign({}, changePwdForm, {
                password: Object.assign({}, changePwdForm.password, { val: '' }),
                new_password: Object.assign({}, changePwdForm.new_password, { val: '' }),
                new_password_confirmation: Object.assign({}, changePwdForm.new_password_confirmation, { val: '' }),
              })
            });
          });
        }
      });
  }

  render() {
    const { message, messageOk, submitting, changePwdForm } = this.state;
    const updateValue = (name, value) => {
      const { changePwdForm } = this.state;
      this.setState({
        changePwdForm: Object.assign({}, changePwdForm, {
          [name]: Object.assign({}, changePwdForm[name], {val: value, error: null})
        })
      });
    }
    return (
      <form>
        {message && <p className={messageOk ? "message-success" : "message-error"}>{message}</p>}
        <FormInputs definition={changePwdForm} updateValue={updateValue} />
        <div className="form-actions">
          <button type="submit" onClick={this.changePwd} disabled={submitting}>Change password</button>
        </div>
      </form>
    );
  }
}

export default connect(
  state => ({}),
  dispatch => ({
    doChangePassword: (password, new_password, new_password_confirmation) => dispatch(changePassword(password, new_password, new_password_confirmation))
  })
)(ChangePasswordForm);
