import React from "react";

class Sorting extends React.Component {
  constructor(props) {
    super(props)
    this.state = {show: false}
  }
  render() {
    const {
      active,
      collection,
      onChange
    } = this.props;

    const toggle = () => {
      this.setState({
        show: !this.state.show
      });
    }

    const handleClick = (sortBy) => {
      return () => {
        toggle();
        onChange(sortBy)();
      }
    }

    const list = collection.map(item => {
      return (
        <button
          key={item}
          className={`list-filter-option ${
            active.indexOf(item) > -1 ? "active" : ""
          }`}
          onClick={handleClick(item)}
        >
          <span className="icon">
            <span className={`icon-${
              active.indexOf(`+${item}`)  > -1 ? "up" : ""
            }${
              active.indexOf(`-${item}`)  > -1 ? "down" : ""
            }`}></span>
          </span>
          {item}
        </button>
      );
    })

    const { show } = this.state;

    return (
      <div className="list-filter">
        {collection.length > 1 && (
          <button
            className="list-filter-toggle btn-reset"
            onClick={toggle}
          >
            {active.replace("+", "").replace("-", "")}
            <span className={`icon-${active.indexOf("+") > -1 ? "up" : "down"}`}></span>
          </button>
        )}

        {collection.length === 1 && (
          <button
            className="list-filter-toggle btn-reset"
            onClick={onChange}
          >
            {active.replace("+", "").replace("-", "")}
            <span className={`icon-${active.indexOf("+") > -1 ? "up" : "down"}`}></span>
          </button>
        )}

        {show && (
          <div className="list-filter-options">
            <div
              className="list-filter-backdrop"
              onClick={toggle}
            ></div>
            {list}
          </div>
        )}
      </div>
    );
  }
}

export default Sorting;
