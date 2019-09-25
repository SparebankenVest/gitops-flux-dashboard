import React from 'react';
import moment from 'moment';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDocker } from '@fortawesome/free-brands-svg-icons';
import { faClock } from '@fortawesome/free-regular-svg-icons';
import { faFilter } from '@fortawesome/free-solid-svg-icons';

export default class ImageDescription extends React.Component {
  render() {
    let {container} = this.props;

    if(!container) {
      return null;
    }

    let filter = null;
    if(container.image.current.tagPolicy) {
      filter = <p><FontAwesomeIcon icon={faFilter} style={{color: "gray"}} /> {container.image.current.tagPolicy}</p>;
    }

    return (
      <td style={{marginBottom: "20px", width: "99%"}} className="image-name" >
        <p><FontAwesomeIcon style={{color: "gray"}} icon={faDocker} /> {container.image.current.id}</p>
        {filter}
        <p><FontAwesomeIcon style={{color: "gray"}} icon={faClock} /> {moment(container.image.current.createdAt).fromNow()}</p>
      </td>
    );
  }
}
