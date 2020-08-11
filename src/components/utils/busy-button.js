import React from "react";

class BusyButton extends React.Component {
  state = {
    isDisabled: undefined,
    isBusy: false,
  };

  componentDidMount() {
    this._ismounted = true;
  }

  componentWillUnmount() {
    this._ismounted = false;
  }

  render() {
    const {
      className,
      onClick,
      type,
      children,
      busyChildren,
      disabled,
    } = this.props;
    const { isBusy, isDisabled } = this.state;
    let isInDisabledState = isDisabled !== undefined ? isDisabled : disabled;
    let classNames = className;
    if (isBusy) {
      classNames = `${classNames} btn-busy`;
    }
    if (isDisabled) {
      classNames = `${classNames} btn-disabled`;
    }
    return (
      <button
        className={classNames}
        type={type || "button"}
        disabled={isInDisabledState}
        onClick={(e) => {
          this.setState({
            isBusy: true,
            isDisabled: true,
          });
          return Promise.resolve(onClick(e)).then((r) => {
            this._ismounted &&
              this.setState({ isBusy: false, isDisabled: undefined });
            return r;
          });
        }}
      >
        {isBusy ? busyChildren : children}
      </button>
    );
  }
}

export default BusyButton;
