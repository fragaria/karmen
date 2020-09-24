import React, { useState } from "react";

import Collapsible from "../utils/collapsible";

export const ClipboardButton = ({ valueToCopy }) => {
  const [copied, setCopied] = useState(false);

  const copy = (evt) => {
    evt.preventDefault();
    navigator.clipboard.writeText(valueToCopy);
    setCopied(true);
  };

  return (
    <button className="btn btn-formsized" onClick={copy}>
      {copied ? "Copied!" : "Copy"}
    </button>
  );
};

const FormFields = ({ definition, updateValue }) => {
  return Object.keys(definition).map((name) => {
    switch (definition[name].type) {
      case "text":
      case "password":
      case "email":
        return (
          <React.Fragment key={name}>
            <label htmlFor={name}>{definition[name].name}</label>
            <div className="input-group-line">
              <input
                type={definition[name].type}
                id={name}
                name={name}
                autoComplete={definition[name].autocomplete}
                value={definition[name].val}
                disabled={definition[name].disabled}
                readOnly={definition[name].readOnly}
                onChange={(e) => updateValue(name, e.target.value, e.target)}
                required={definition[name].type === "email"}
              />
              {definition[name].clipboardSupport && (
                <ClipboardButton valueToCopy={definition[name].val} />
              )}
            </div>
            <span>
              {definition[name].helpText && (
                <small className="help">{definition[name].helpText}</small>
              )}
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
              disabled={definition[name].disabled}
              readOnly={definition[name].readOnly}
              maxLength={definition[name].maxLength}
              onChange={(e) => updateValue(name, e.target.value)}
            ></textarea>
            <span>
              {definition[name].helpText && (
                <small className="help">{definition[name].helpText}</small>
              )}
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
              disabled={definition[name].disabled}
              readOnly={definition[name].readOnly}
              onChange={(e) => updateValue(name, e.target.checked)}
            />
            <span>
              {definition[name].helpText && (
                <small className="help">{definition[name].helpText}</small>
              )}
              {definition[name].error && (
                <small>{definition[name].error}</small>
              )}
            </span>
          </React.Fragment>
        );
      case "select":
        const opts = definition[name].options.map((opt) => {
          return (
            <option
              key={opt.val}
              value={opt.val}
              data-testid={`${name}--${opt.val}`}
            >
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
              disabled={definition[name].disabled}
              readOnly={definition[name].readOnly}
              onChange={(e) => updateValue(name, e.target.value)}
            >
              {opts}
            </select>
            <span>
              {definition[name].helpText && (
                <small className="help">{definition[name].helpText}</small>
              )}
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
            id={`hpot56-${name}-${Math.random().toString(36).substring(7)}`}
            name={`hpot56-${name}-${Math.random().toString(36).substring(7)}`}
            autoComplete="new-password"
            className="honeypot-field"
            disabled={definition[name].disabled}
            onChange={(e) => updateValue(name, e.target.value)}
          />
        );
      case "collapsible":
        return (
          <React.Fragment key={name}>
            <span></span>
            <Collapsible
              collapsedStateText={definition[name].collapsedStateText}
              expandedStateText={definition[name].expandedStateText}
              isInForm
            >
              <FormFields
                definition={definition[name].inputs}
                updateValue={updateValue}
              />
            </Collapsible>
            <span></span>
          </React.Fragment>
        );
      default:
        return null;
    }
  });
};

export const FormInputs = ({ definition, updateValue }) => {
  return (
    <div className="input-group">
      <FormFields definition={definition} updateValue={updateValue} />
    </div>
  );
};

export default FormInputs;
