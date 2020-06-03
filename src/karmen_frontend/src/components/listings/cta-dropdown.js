import React from "react";

class CtaDropdown extends React.Component {
  constructor(props) {
    super(props);
    this.dropdownItems = React.createRef();
  }

  componentDidUpdate() {
    const dropdownItems = this.dropdownItems.current;

    const countViewportHeight = (dropdownItems) => {
      const vh = window.innerHeight * 0.01;
      dropdownItems.style.setProperty("--vh", `${vh}px`);
    };

    if (dropdownItems) {
      countViewportHeight(dropdownItems);
      window.addEventListener("resize", () => {
        countViewportHeight(dropdownItems);
      });
    }
  }

  render() {
    const { children, onToggle, expanded } = this.props;

    return (
      <div className="dropdown list-cta" role="menu">
        <button
          className="dropdown-toggle btn-reset"
          onClick={(e) => {
            e.preventDefault();
            onToggle && onToggle();
          }}
        >
          <span className="icon-kebab"></span>
        </button>

        {expanded && (
          <div className="dropdown-items">
            <div className="dropdown-items-content" ref={this.dropdownItems}>
              {children}
            </div>
            <div className="dropdown-backdrop" onClick={onToggle}></div>
          </div>
        )}
      </div>
    );
  }
}

export default CtaDropdown;
