import React from 'react';

const iconStyle = {
  fontSize: "12px",
  color: "#aaa",
  marginRight: "5px"
};

const actionButton = {
  // display: "inline",
  float: "left",
  // borderTop: "1px solid #ccc",
  // borderLeft: "1px solid #ccc",
  // borderBottom: "1px solid #ccc",
  // height: "30px",
  // float: "none",
  // overflow: "hidden",
  // borderRadius: "6px 0 0 6px",
  // marginTop: "10px",
  // textAlign: "middle",
  // padding: "5px",
  color: "#444",
  // width: "100%",
}

const actionDropDown = {
  // display: "inline",
  float: "right",
  // display: "inline",
  // borderTop: "1px solid #ccc",
  // borderRight: "1px solid #ccc",
  // borderBottom: "1px solid #ccc",
  // height: "30px",
  // width: "100%",
  // borderRadius: "0 6px 6px 0",
  // marginTop: "10px",
  // textAlign: "middle",
  // padding: "5px",
  // paddingRight: "2px",
}

export default class FluxOperations extends React.Component {

  render() {
    return (
      <div style={{ backgroundColor: "#eee", border: "1px solid #ccc", borderRadius: "4px", padding: "4px", paddingRight: "0px", height: "13px", marginTop: "10px", whiteSpace: "nowrap", fontSize: "12px" }}>
        <span style={actionButton}><i className="fas fa-tools"></i></span>
        <span style={actionDropDown}><i className="fas fa-angle-down" style={iconStyle}></i></span>
      </div>
      // <div style={{marginTop: "10px"}} className="flux-operations2">
      //   <button><i className="fas fa-sync-alt" style={iconStyle}></i> Automate</button>
      //   <button><i className="fas fa-ban" style={iconStyle}></i> De-automate</button>
      //   <button><i className="fas fa-lock" style={iconStyle}></i> Lock</button>
      // </div>
    );
  }
}
