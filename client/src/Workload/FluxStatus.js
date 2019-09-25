import React from 'react';

export default class FluxStatus extends React.Component {
  render() {
    return (
      <div className="flux-operations">
        {this.props.fluxState.automated ? <div className="active"><i className="fas fa-cog"></i> Automated</div>: <div><i className="fas fa-minus-circle"></i> Not automated</div>}
        {this.props.fluxState.locked ? <div className="active"><i className="fas fa-lock"></i> Locked</div>: <div><i className="fas fa-lock-open"></i> Un-locked</div>}
      </div>
    );
  }
}
