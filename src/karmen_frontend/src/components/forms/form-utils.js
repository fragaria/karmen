import React from "react";

export const FormInputs = ({ definition, updateValue }) => {
  const optionRows = Object.keys(definition).map(name => {
    switch (definition[name].type) {
      case "text":
      case "password":
        return (
          <React.Fragment key={name}>
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
          </React.Fragment>
        );
      case "textarea":
        return (
          <React.Fragment key={name}>
            <label htmlFor={name}>{definition[name].name}</label>
            <textarea
              id={name}
              name={name}
              value={definition[name].val}
              onChange={e => updateValue(name, e.target.value)}
            ></textarea>
            <span>
              {definition[name].error && (
                <small>{definition[name].error}</small>
              )}
            </span>
          </React.Fragment>
        );
      case "checkbox":
        return (
          <React.Fragment key={name}>
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
          </React.Fragment>
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
          <React.Fragment key={name}>
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
          </React.Fragment>
        );
      case "honeypot":
        return (
          <input
            key={name}
            type="text"
            id={name}
            name={name}
            autocomplete="off"
            className="honeypot-field"
            onChange={e => updateValue(name, e.target.value)}
          />
        );
      default:
        return null;
    }
  });

  return <div className="input-group">{optionRows}</div>;
};

export default FormInputs;
