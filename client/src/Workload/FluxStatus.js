import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCog, faLock, faLockOpen, faMinusCircle } from '@fortawesome/free-solid-svg-icons';

export default class FluxStatus extends React.Component {
  render() {
    return (
      <div className="flux-operations">
        {this.props.fluxState.automated ? <div className="active"><FontAwesomeIcon icon={faCog} /> Automated</div>: <div><FontAwesomeIcon icon={faMinusCircle} style={{color: "#aaa"}}/> Not automated</div>}
        {this.props.fluxState.locked ? <div className="active"><FontAwesomeIcon icon={faLock} /> Locked</div>: <div><FontAwesomeIcon icon={faLockOpen} style={{color: "#aaa"}} /> Un-locked</div>}
      </div>
    );
  }
}
