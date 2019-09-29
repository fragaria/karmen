import React from 'react';
import { BackButton } from './back';

class BoxedModal extends React.Component {
  render() {
    const { onBack, children, inverse } = this.props;
    return (
      <div className={inverse ? 'boxed-modal boxed-modal-inverse' : 'boxed-modal'}>
        {children}
        <BackButton onClick={onBack} />
      </div>
    );
  }

}

export default BoxedModal;
