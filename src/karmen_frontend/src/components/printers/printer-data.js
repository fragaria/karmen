import React from "react";
import formatters from "../../services/formatters";

export const ClientVersion = (printerObject) => {
  if (printerObject) {
    const objectLength = Object.keys(printerObject).length;
    return Object.keys(printerObject).map((key, idx) => {
      return (
        <React.Fragment key={key}>
          {key}
          {": "}
          {printerObject[key]}
          {objectLength - 1 > idx && (
            <>
              {objectLength - 1}
              {", "}
            </>
          )}
        </React.Fragment>
      );
    });
  } else {
    return <>-</>;
  }
};

export const PrinterProperties = ({ printer }) => {
  const props = printer.printer_props;
  return (
    <>
      {props && Object.keys(props) && (
        <>
          {props.filament_type && (
            <>
              <dt className="term">Filament type:</dt>
              <dd className="description">{props.filament_type}</dd>
            </>
          )}

          {props.filament_color && (
            <>
              <dt className="term">Filament color:</dt>
              <dd className="description">{props.filament_color}</dd>
            </>
          )}

          {props.tool0_diameter && (
            <>
              <dt className="term">Tool diameter:</dt>
              <dd className="description">{props.tool0_diameter} mm</dd>
            </>
          )}

          {props.bed_type && (
            <>
              <dt className="term">Bed type:</dt>
              <dd className="description">{props.bed_type}</dd>
            </>
          )}

          {props.note && (
            <>
              <dt className="term">Note:</dt>
              <dd className="description">{props.note}</dd>
            </>
          )}
        </>
      )}
    </>
  );
};

export const PrinterProgress = ({ printer }) => {
  const progress = printer.job;
  const temperatures = printer.status && printer.status.temperature;
  if (!progress || !progress.name) {
    return <></>;
  }
  return (
    <>
      <dt className="term">Printing file:</dt>
      <dd className="description">{progress.name}</dd>
      <dt className="term">Completed:</dt>
      <dd className="description">
        {progress.completion && `${progress.completion.toFixed(2)}%`}
      </dd>
      <dt className="term">Time elapsed:</dt>
      <dd className="description">{formatters.timespan(progress.printTime)}</dd>
      <dt className="term">ETA:</dt>
      <dd className="description">
        {formatters.timespan(progress.printTimeLeft)}
      </dd>
      {temperatures && (
        <>
          {temperatures.tool0 && (
            <>
              <dt className="term">Tool:</dt>
              <dd className="description">
                {temperatures.tool0.actual}°C/{temperatures.tool0.target}°C
              </dd>
            </>
          )}
          {temperatures.bed && (
            <>
              <dt className="term">Bed:</dt>
              <dd className="description">
                {temperatures.bed.actual}°C/{temperatures.bed.target}°C
              </dd>
            </>
          )}
        </>
      )}
    </>
  );
};

export const PrinterConnectionStatus = ({ printer }) => {
  return (
    <dl className="dl-horizontal">
      {printer.client && (
        <>
          <dt className="term">Client: </dt>
          <dd className="description">
            {printer.client.name}
            <div className="text-reset">
              <small>{ClientVersion(printer.client.version)}</small>
            </div>
          </dd>
          {printer.client.pill_info != null ? (
            <>
              <dt className="term">Pill version:</dt>
              <dd className="description">
                {printer.client.pill_info.version_number}
              </dd>
              <dt className="term">Update available:</dt>
              <dd className="description">
                {printer.client.pill_info.update_available
                  ? `Yes (${printer.client.pill_info.update_available})`
                  : "No"}
              </dd>
            </>
          ) : null}
        </>
      )}
      {!window.env.IS_CLOUD_INSTALL && (printer.hostname || printer.ip) && (
        <>
          <dt className="term">Client host: </dt>
          <dd className="decription text-mono">
            {printer.hostname && (
              <a
                className="anchor"
                href={`${printer.protocol}://${printer.hostname}${
                  printer.port ? `:${printer.port}` : ""
                }${printer.path ? `${printer.path}` : ""}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                {printer.hostname}
                {printer.port ? `:${printer.port}` : ""}
                {printer.path ? `${printer.path}` : ""}
              </a>
            )}
            {printer.hostname && " ("}
            <a
              className="anchor"
              href={`${printer.protocol}://${printer.ip}${
                printer.port ? `:${printer.port}` : ""
              }${printer.path ? `${printer.path}` : ""}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              {printer.ip}
              {printer.port ? `:${printer.port}` : ""}
              {printer.path ? `${printer.path}` : ""}
            </a>
            {printer.hostname && ")"}
          </dd>
        </>
      )}
      {window.env.IS_CLOUD_INSTALL && printer.token && (
        <>
          <dt className="term">Device token: </dt>
          <dd className="decription">{printer.token}</dd>
        </>
      )}
      {printer.client && printer.client.api_key && (
        <>
          <dt className="term">API Key: </dt>
          <dd className="decription">{printer.client.api_key}</dd>
        </>
      )}
    </dl>
  );
};

export default {
  PrinterProgress,
  PrinterProperties,
  ClientVersion,
  PrinterConnectionStatus,
};
