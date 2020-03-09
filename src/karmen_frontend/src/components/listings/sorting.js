import React from "react";

class Sorting extends React.Component {
  constructor(props) {
    super(props);
    this.dropdownItems = React.createRef();
    this.state = { expand: false };
  }

  componentDidUpdate() {
    const dropdownItems = this.dropdownItems.current;

    const countViewportHeight = (dropdownItems) => {
      const vh = window.innerHeight * 0.01;
      dropdownItems.style.setProperty('--vh', `${vh}px`);
    }

    if (dropdownItems) {
      countViewportHeight(dropdownItems);
      window.addEventListener('resize', () => {
        countViewportHeight(dropdownItems)
      });
    }
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
          className={`dropdown-item ${
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
      <div className="dropdown sorting">
        <button
          className="dropdown-toggle btn-reset"
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
          <div className="dropdown-items" ref={this.dropdownItems}>
            <div className="dropdown-items-content">
              <span className="dropdown-title">Sort by</span>
              {list}
            </div>
            <div className="dropdown-backdrop" onClick={toggle}></div>
          </div>
        )}
      </div>
    );
  }
}

export default Sorting;
