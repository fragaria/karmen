import React from 'react';
import { FormInputs } from '../components/form-utils';

export class PrinterEditForm extends React.Component {
  state = {
    initialized: false,
    submitting: false,
    message: null,
    messageOk: false,
    form: {
      name: {
        name: "Change printer's name",
        val: '',
        type: 'text',
        required: true,
        error: null,
      }
    }
  }

  constructor (props) {
    super(props);
    this.submit = this.submit.bind(this);
  }

  componentDidMount () {
    const { initialized, form } = this.state;
    const { defaults } = this.props;
    if (!initialized && defaults) {
      this.setState({
        initialized: true,
        form: Object.assign({}, form, {
          name: Object.assign({}, form.name, {val: defaults.name, error: null})
        })
      })
    }
  }

  submit (e) {
    e.preventDefault();
    this.setState({
      submitting: true,
      messageOk: false,
      message: null,
    });
    const { form } = this.state;
    const { onSubmit } = this.props;
    if (!form.name.val) {
      this.setState({
        submitting: false,
        form: Object.assign({}, form, {
          name: Object.assign({}, form.name, {
            error: 'Name cannot be empty',
          })
        })
      });
      return;
    }
    onSubmit({
      name: form.name.val
    }).then((result) => {
      this.setState({
        message: result.message,
        messageOk: result.ok,
        submitting: false,
      });
    }).catch((e) => {
      this.setState({
        message: e,
        messageOk: false,
        submitting: false,
      });
    });
  }

  render () {
    const { message, messageOk, form, submitting } = this.state;
    const { onCancel } = this.props;
    const updateValue = (name, value) => {
      const { form } = this.state;
      this.setState({
        form: Object.assign({}, form, {
          [name]: Object.assign({}, form[name], {val: value, error: null})
        })
      });
    }
    return (
      <form>
        {message && <p className={messageOk ? "message-success" : "message-error"}>{message}</p>}
        <FormInputs definition={form} updateValue={updateValue} />
        <div className="form-actions">
          <button type="submit" onClick={this.submit} disabled={submitting}>Save</button>
          <button type="reset" onClick={onCancel} disabled={submitting}>Cancel</button>
        </div>
      </form>);
  }
}