import React from 'react';
import moment from 'moment';

export default class ImageDescription extends React.Component {
  render() {
    let {container} = this.props;

    if(!container) {
      return null;
    }

    let filter = null;
    if(container.image.current.tagPolicy) {
      filter = <p><i style={{color: "gray"}} className="fas fa-filter" /> {container.image.current.tagPolicy}</p>;
    }

    return (
      <td style={{marginBottom: "20px", width: "99%"}} className="image-name" >
        <p><i style={{color: "gray"}} className="fab fa-docker" /> {container.image.current.id}</p>
        {filter}
        <p><i style={{color: "gray"}} className="far fa-clock" /> {moment(container.image.current.createdAt).fromNow()}</p>
      </td>
    );
  }
}
