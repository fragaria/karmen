import React from "react";

export const FormInputs = ({ definition, updateValue }) => {
  const optionRows = Object.keys(definition).map(name => {
    switch (definition[name].type) {
      case "text":
      case "password":
        return (
          <p key={name}>
            <label htmlFor={name}>{definition[name].name}</label>
            <input
              type={definition[name].type}
              id={name}
              name={name}
              value={definition[name].val}
              onChange={e => updateValue(name, e.target.value)}
            />
            {definition[name].error && <small>{definition[name].error}</small>}
          </p>
        );
      case "checkbox":
        return (
          <p key={name}>
            <label htmlFor={name}>{definition[name].name}</label>
            <input
              type="checkbox"
              id={name}
              name={name}
              checked={definition[name].val}
              onChange={e => updateValue(name, e.target.checked)}
            />
            {definition[name].error && <small>{definition[name].error}</small>}
          </p>
        );
      case "select":
        const opts = definition[name].options.map(opt => {
          return (
            <option key={opt.val} value={opt.val}>
              {opt.name}
            </option>
          );
        });
        return (
          <p key={name}>
            <label htmlFor={name}>{definition[name].name}</label>
            <select
              id={name}
              name={name}
              value={definition[name].val}
              onChange={e => updateValue(name, e.target.value)}
            >
              {opts}
            </select>
            {definition[name].error && <small>{definition[name].error}</small>}
          </p>
        );
      default:
        return null;
    }
  });

  return <>{optionRows}</>;
};

export default FormInputs;
