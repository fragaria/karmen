import React from "react";

class ListCta extends React.Component {
  constructor(props) {
    super(props);
    this.state = { expand: false };
  }

  render() {
    const { children } = this.props;
    const { expand } = this.state;

    const toggle = () => {
      this.setState({
        expand: !expand
      });
    };

    return (
      <div className="list-dropdown list-cta">
        <button
          className="list-dropdown-toggle btn-reset"
          onClick={e => {
            e.preventDefault();
            return toggle();
          }}
        >
          <span className="icon-kebab"></span>
        </button>

        {expand && (
          <div className="list-dropdown-items">
            {children}
            <div className="list-dropdown-backdrop" onClick={toggle}></div>
          </div>
        )}
      </div>
    );
  }
}

export default ListCta;
