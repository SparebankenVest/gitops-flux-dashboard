import React from 'react';

export default class ImageDescription extends React.Component {
  render() {
    return (
      <div>
        <div className="image-name" >
          <h1><i className="fas fa-dice-d6" style={{color: "gray"}}></i>&nbsp; {this.props.container.name}</h1>
          <p>{this.props.container.current.imageName}</p>
        </div>
      </div>
    );
  }
}
