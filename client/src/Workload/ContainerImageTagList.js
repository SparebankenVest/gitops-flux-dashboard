import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLongArrowAltDown, faLongArrowAltRight, faLongArrowAltUp } from '@fortawesome/free-solid-svg-icons';

export default class ContainerImageTagList extends React.Component {
  formatTag(tag) {
    if(!tag) {
      return "";
    }

    if(tag.length <= 15) {
      return tag;
    }

    var start = tag.substring(0, 8);
    var end = tag.substring(tag.length - 5);
    return <span title={tag} style={{cursor: "default"}}>{start}..{end}</span>;
  }

  renderImages(container) {
    let currentPos = container.image.available.findIndex(img => img.id === container.image.current.id);
    let imageHistory = [];

    let arrowWidth = "10px";

    if(container.image.newer.length > 2) {
      imageHistory.push(container.image.newer.slice(0, 1).map(newer => <p key={newer.id}><FontAwesomeIcon style={{width: arrowWidth}} icon={faLongArrowAltDown} /> {this.formatTag(newer.tag)}</p>));    
      imageHistory.push(<p key={container.image.current.id + '-con'} style={{color: "#888", padding: "3px 0 3px 0"}}><FontAwesomeIcon style={{width: arrowWidth}} icon={faLongArrowAltDown} /> ...</p>);  
    }
    else {
      imageHistory.push(container.image.newer.slice(0, container.image.newer.length).map(newer => <p key={newer.id}><FontAwesomeIcon style={{width: arrowWidth}} icon={faLongArrowAltDown} /> {this.formatTag(newer.tag)}</p>));      
    }

    imageHistory.push(<p key={container.image.current.id} style={{fontWeight: "bold"}}><FontAwesomeIcon style={{width: arrowWidth}} icon={faLongArrowAltRight} /> {this.formatTag(container.image.current.tag)}</p>);  

    if(currentPos === 0) {
      imageHistory.push(container.image.available.slice(1, 3).map(older => <p key={older.id}><FontAwesomeIcon style={{width: arrowWidth}} icon={faLongArrowAltUp} /> {this.formatTag(older.tag)}</p>));    
    }
    else if(currentPos > 0){
      imageHistory.push(container.image.available.slice(currentPos+1, currentPos+2).map(older => <p key={older.id}><FontAwesomeIcon style={{width: arrowWidth}} icon={faLongArrowAltUp} /> {this.formatTag(older.tag)}</p>));    
    }

    return (
      <div style={{whiteSpace: "nowrap"}}>
        {imageHistory.map(img => img)}
      </div>
    );
  }

  render() {
    let {container} = this.props;

    if(!container) {
      return null;
    }

    return (
      <td style={{fontFamily: "monospace", fontSize: "13px", minWidth: "150px"}}>
        {this.renderImages(container)}
      </td>
    );
  }
}
