import React from "react";
import formatters from "../../services/formatters";

export const Progress = ({
  completion,
  printTime,
  printTimeLeft,
  withProgressBar = true,
  withProgressInfo = false,
}) => {
  let progressBarWidth = {
    width: (printTime > 0 ? completion.toFixed(2) : "0") + "%",
  };
  let approxPrintTimeLeft = printTimeLeft;
  if (!approxPrintTimeLeft && printTime > 0) {
    approxPrintTimeLeft = (printTime / completion) * (100 - completion);
  }
  if (approxPrintTimeLeft) {
    approxPrintTimeLeft = formatters.timespan(approxPrintTimeLeft);
  }
  return (
    <div className="progress">
      {withProgressInfo && (
        <div className="progress-detail">
          {approxPrintTimeLeft ? (
            <React.Fragment>
              {printTime > 0 ? completion.toFixed(2) : "0"}% (
              {approxPrintTimeLeft || "?"} remaining)
            </React.Fragment>
          ) : (
            <React.Fragment></React.Fragment>
          )}
        </div>
      )}
      {withProgressBar && (
        <div className="progress-bar" style={progressBarWidth}></div>
      )}
    </div>
  );
};

export default Progress;
