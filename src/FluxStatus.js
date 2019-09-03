import React from 'react';

export default class FluxStatus extends React.Component {
  render() {
    return (
      <div className="flux-operations">
        <div>{this.props.workload.automated ? <i className="fas fa-check"></i> : <i className="fas fa-times"></i> } Automated</div>
        <div>{this.props.workload.automated ? <i className="fas fa-check"></i> : <i className="fas fa-times"></i> } Locked</div>
      </div>
    );
  }
}
