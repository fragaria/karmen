import React from "react";
import { FormInputs } from "../components/form-utils";
import BusyButton from "../components/busy-button";

export class PrinterEditForm extends React.Component {
  state = {
    initialized: false,
    message: null,
    messageOk: false,
    form: {
      name: {
        name: "Printer's name",
        val: "",
        type: "text",
        required: true
      },
      filament_type: {
        name: "Loaded filament type (PLA, PETG, ABS...)",
        val: "",
        type: "text"
      },
      filament_color: {
        name: "Loaded filament color",
        val: "",
        type: "text"
      },
      bed_type: {
        name: "Bed type",
        val: "",
        type: "text"
      },
      tool0_diameter: {
        name: "Tool 0 diameter",
        val: "",
        type: "text"
      }
    }
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
            error: null
          }),
          filament_type: Object.assign({}, form.filament_type, {
            val: defaults.filament_type,
            error: null
          }),
          filament_color: Object.assign({}, form.filament_color, {
            val: defaults.filament_color,
            error: null
          }),
          bed_type: Object.assign({}, form.bed_type, {
            val: defaults.bed_type,
            error: null
          }),
          tool0_diameter: Object.assign({}, form.tool0_diameter, {
            val: defaults.tool0_diameter,
            error: null
          })
        })
      });
    }
  }

  submit(e) {
    e.preventDefault();
    this.setState({
      messageOk: false,
      message: null
    });
    const { form } = this.state;
    const { onSubmit } = this.props;
    if (!form.name.val) {
      this.setState({
        form: Object.assign({}, form, {
          name: Object.assign({}, form.name, {
            error: "Name cannot be empty"
          })
        })
      });
      return;
    }
    if (form.tool0_diameter.val && isNaN(parseFloat(form.tool0_diameter.val))) {
      this.setState({
        form: Object.assign({}, form, {
          tool0_diameter: Object.assign({}, form.tool0_diameter, {
            error: "Tool 0 diameter has to be a decimal number"
          })
        })
      });
      return;
    }
    onSubmit({
      name: form.name.val,
      printer_props: {
        filament_type: form.filament_type.val,
        filament_color: form.filament_color.val,
        bed_type: form.bed_type.val,
        tool0_diameter: form.tool0_diameter.val
      }
    })
      .then(result => {
        this.setState({
          message: result.message,
          messageOk: result.ok
        });
      })
      .catch(e => {
        this.setState({
          message: e,
          messageOk: false
        });
      });
  }

  render() {
    const { message, messageOk, form } = this.state;
    const { onCancel } = this.props;
    const updateValue = (name, value) => {
      const { form } = this.state;
      this.setState({
        form: Object.assign({}, form, {
          [name]: Object.assign({}, form[name], { val: value, error: null })
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
