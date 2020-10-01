import React from "react";
import { FormInputs } from "../forms/form-utils";

class UserEditForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      message: null,
      messageOk: false,
      patchMeForm: {
        email: {
          name: "Email",
          val: props.email,
          type: "text",
          required: true,
          disabled: true,
        },
      },
    };
  }


  render() {
    const { patchMeForm } = this.state;

    return (
      <form>
        <FormInputs definition={patchMeForm}  />
      </form>
    );
  }
}

export default UserEditForm;
