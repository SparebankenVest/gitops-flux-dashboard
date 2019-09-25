import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDotCircle } from '@fortawesome/free-regular-svg-icons';
import { faPlayCircle, faQuestionCircle, faCheckCircle, faExclamationCircle } from '@fortawesome/free-solid-svg-icons';

export default class StatusLabel extends React.Component {
  render() {
    let status;

    if(this.props.kubestate && this.props.kubestate.status) {
      status = this.props.kubestate.status.replace(/(\w)(\w*)/g, function(g0,g1,g2){return g1.toUpperCase() + g2.toLowerCase();});
    }
    else {
      status = "Unknown";
    }

    let symbol = faCheckCircle;
    let color = "green";

    if(this.props.kubestate.status !== "ready") {
      if(this.props.kubestate.status === "error") {
        symbol = faExclamationCircle;
        color = "red";
      }
      else if(this.props.kubestate.status === "updating") {
        symbol = faPlayCircle;
        color = "#66d3e4";
      }
      else {
        symbol = faQuestionCircle;
        color = "yellow";
      }
    }

    let pods = [];
    let key = 1;
    let podsInTransition = this.props.kubestate.rollout.updated - this.props.kubestate.rollout.desired + this.props.kubestate.rollout.outdated;

    for (let index = 1; index <= this.props.kubestate.rollout.desired - podsInTransition; index++) {
      pods.push(<FontAwesomeIcon key={key++} style={{color: "green"}} icon={faDotCircle} />);
    }

    for (let index = 1; index <= podsInTransition ; index++) {
      pods.push(<FontAwesomeIcon key={key++} style={{color: "yellow"}} icon={faDotCircle} />);
    }
    // <div style={{display: "inline-block", backgroundColor: color, width: "80px", fontSize: "12px", color: "white", padding: "6px", borderRadius: "12px"}}>
    //   <i className={symbol}></i>&nbsp;&nbsp;{status}
    // </div>

    // style={{paddingLeft: "3px", paddingRight: "3px", backgroundColor: color}}
    return (
      <td>
        <div style={{display: "inline-block", backgroundColor: color, width: "80px", fontSize: "12px", color: "white", padding: "6px", borderRadius: "12px"}}>
          <FontAwesomeIcon icon={symbol} />&nbsp;&nbsp;{status}
        </div>
        <div style={{marginTop: "10px", textAlign: "center" }}>
          <span>
            {pods.map(pod => 
              pod
            )}
          </span>
        </div>
      </td>
    );
  }
}
