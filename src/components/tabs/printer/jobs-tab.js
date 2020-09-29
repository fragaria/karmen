import React from "react";
import { Link } from "react-router-dom";
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
          {gcode_data ? (
            <Link
              className="list-item-subtitle"
              to={`/${orguuid}/gcodes/${gcode_data.file_id}`}
            >
              {gcode_data.file_name}
            </Link>
          ) : (
            <span className="list-item-subtitle">{gcode_data.file_name}</span>
          )}

          <small>
            {"  "}
            {formatters.bytes(gcode_data.file_size)}
            {" - "}
            {formatters.datetime(started)}
            {" - "}
            {username}
          </small>
        </div>
      </div>
    );
  }
}

const JobsTab = ({ orguuid, jobList }) => {
  const fields = jobList.map((job, i)=>{
    return (<PrintJobRow key={i} orguuid={orguuid} gcode_data={job} started={job.started_on} username={job.username}/>);
  });

  return (
    <div>
      {fields}
    </div>
  );
};

export default JobsTab;
