import React from 'react';
import { BackButton } from './back';

class BoxedModal extends React.Component {
  render() {
    const { onBack, children } = this.props;
    return (
      <div className="boxed-modal">
        <BackButton onClick={onBack} />
        {children}
      </div>
    );
  }

}

export default BoxedModal;
