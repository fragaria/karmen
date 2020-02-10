import React from "react";

class Sorting extends React.Component {
  constructor(props) {
    super(props);
    this.state = { expand: false };
  }
  render() {
    const { active, columns, onChange } = this.props;
    const toggle = () => {
      const { expand } = this.state;
      this.setState({
        expand: !expand
      });
    };

    const handleClick = sortBy => {
      return () => {
        toggle();
        return onChange(sortBy)();
      };
    };

    const list = columns.map(item => {
      return (
        <button
          key={item}
          className={`list-dropdown-item ${
            active.indexOf(item) > -1 ? "active" : ""
          }`}
          onClick={handleClick(item)}
        >
          <span
            className={`icon-${active.indexOf(`+${item}`) > -1 ? "up" : ""}${
              active.indexOf(`-${item}`) > -1 ? "down" : ""
            }`}
          ></span>
          {item}
        </button>
      );
    });

    const { expand } = this.state;

    return (
      <div className="list-dropdown">
        <button
          className="list-dropdown-toggle btn-reset"
          onClick={e => {
            e.preventDefault();
            if (columns.length === 1) {
              return onChange(columns[0])();
            } else {
              return toggle();
            }
          }}
        >
          {active.replace("+", "").replace("-", "")}
          <span
            className={`icon-${active.indexOf("+") > -1 ? "up" : "down"}`}
          ></span>
        </button>

        {expand && (
          <div className="list-dropdown-items">
            <div className="list-dropdown-backdrop" onClick={toggle}></div>
            {list}
          </div>
        )}
      </div>
    );
  }
}

export default Sorting;
