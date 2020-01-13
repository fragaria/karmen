import React from "react";

export const FormInputs = ({ definition, updateValue }) => {
  const optionRows = Object.keys(definition).map(name => {
    switch (definition[name].type) {
      case "text":
      case "password":
        return (
          <>
            <label htmlFor={name}>{definition[name].name}</label>
            <input
              type={definition[name].type}
              id={name}
              name={name}
              value={definition[name].val}
              onChange={e => updateValue(name, e.target.value)}
            />
            <span>
              {definition[name].error && (
                <small>{definition[name].error}</small>
              )}
            </span>
          </>
        );
      case "checkbox":
        return (
          <>
            <label htmlFor={name}>{definition[name].name}</label>
            <input
              type="checkbox"
              id={name}
              name={name}
              checked={definition[name].val}
              onChange={e => updateValue(name, e.target.checked)}
            />
            <span>
              {definition[name].error && (
                <small>{definition[name].error}</small>
              )}
            </span>
          </>
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
          <>
            <label htmlFor={name}>{definition[name].name}</label>
            <select
              id={name}
              name={name}
              value={definition[name].val}
              onChange={e => updateValue(name, e.target.value)}
            >
              {opts}
            </select>
            <span>
              {definition[name].error && (
                <small>{definition[name].error}</small>
              )}
            </span>
          </>
        );
      default:
        return null;
    }
  });

  return <div className="input-group">{optionRows}</div>;
};

export default FormInputs;
