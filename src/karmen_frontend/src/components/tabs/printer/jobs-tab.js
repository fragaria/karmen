import React from "react";
import { Link } from "react-router-dom";
import Listing from "../../listings/wrapper";
import formatters from "../../../services/formatters";

class PrintJobRow extends React.Component {
  render() {
    const { orguuid, gcode_data, started, username } = this.props;
    if (!gcode_data) {
      return <div className="list-item"></div>;
    }
    return (
      <div className="list-item">
        <div className="list-item-content">
          {gcode_data && gcode_data.available ? (
            <Link
              className="list-item-subtitle"
              to={`/${orguuid}/gcodes/${gcode_data.uuid}`}
            >
              {gcode_data.filename}
            </Link>
          ) : (
            <span className="list-item-subtitle">{gcode_data.filename}</span>
          )}

          <small>
            {formatters.bytes(gcode_data.size)}
            {", "}
            {formatters.datetime(started)}
            {", "}
            {username}
          </small>
        </div>
      </div>
    );
  }
}

const JobsTab = ({ orguuid, jobList, loadJobsPage, clearJobsPages }) => {
  return (
    <div>
      <Listing
        enableFiltering={false}
        itemList={jobList}
        loadPage={loadJobsPage}
        rowFactory={j => {
          return <PrintJobRow key={j.uuid} {...j} orguuid={orguuid} />;
        }}
        sortByColumns={["started"]}
        clearItemsPages={clearJobsPages}
      />
    </div>
  );
};

export default JobsTab;
