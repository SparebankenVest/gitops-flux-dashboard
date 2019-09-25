import React from 'react';

export default class StatusLabel extends React.Component {
  render() {
    let status = this.props.kubestate.status.replace(/(\w)(\w*)/g, function(g0,g1,g2){return g1.toUpperCase() + g2.toLowerCase();});

    let symbol = "fas fa-check-circle";
    let color = "green";

    if(this.props.status !== "ready") {
      if(this.props.status === "error") {
        symbol = "fas fa-exclamation-circle";
        color = "red";
      }
      else if(this.props.status === "updating") {
        symbol = "fas fa-play-circle";
        color = "#66d3e4";
      }
      else {
        symbol = "fas fa-question-circle";
        color = "yellow";
      }
    }

    // <div style={{display: "inline-block", backgroundColor: color, width: "80px", fontSize: "12px", color: "white", padding: "6px", borderRadius: "12px"}}>
    //   <i className={symbol}></i>&nbsp;&nbsp;{status}
    // </div>

    // style={{paddingLeft: "3px", paddingRight: "3px", backgroundColor: color}}
    return (
      <td>
        <div style={{display: "inline-block", backgroundColor: color, width: "80px", fontSize: "12px", color: "white", padding: "6px", borderRadius: "12px"}}>
          <i className={symbol}></i>&nbsp;&nbsp;{status}
        </div>
      </td>
    );
  }
}
