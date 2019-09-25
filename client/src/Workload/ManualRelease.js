import React from 'react';
import moment from 'moment';

export default class ManualRelease extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      selectedContainer: "",
      selectedImage: "",
    };

    this.handleContainerChange = this.handleContainerChange.bind(this);
    this.handleImageChange = this.handleImageChange.bind(this);
    this.handleDeploy = this.handleDeploy.bind(this);
  }

  componentDidMount() {
    let selectedContainer = this.props.workload.containers[0].image.current.id;
    let activeContainer = this.props.workload.containers.find(container => container.image.current.id === selectedContainer);
    this.setState({ 
      selectedContainer: selectedContainer,
      selectedImage: activeContainer ? activeContainer.image.current.id : "",
    });
  }
  
  handleContainerChange(e) {
    e.preventDefault();
    let value = e.target.value; 
    let activeContainer = this.props.workload.containers.find(container => container.image.current.id === value);

    this.setState({ 
      selectedContainer: value,
      selectedImage: activeContainer ? activeContainer.image.current.id : "",
    });
  }

  handleImageChange(e) {
    e.preventDefault();
    let value = e.target.value; 
    this.setState({ 
      selectedImage: value,
    });
  }

  handleDeploy() {
    const {workload} = this.props;
    const {selectedContainer, selectedImage} = this.state;

    console.log(`current container : ${selectedContainer}`);

    let activeContainer = this.props.workload.containers.find(container => container.image.current.id === selectedContainer);
    if(activeContainer) {
      this.props.onDeploy(workload, activeContainer.image.available.find(img => img.id === selectedImage));
    }
    else {
      console.error('No active container to deploy');
    }
  }

  formatOption(img) {
    return {
      value: img.ID, 
      label: `${img.tag} (${moment(img.createdAt).fromNow()})`
    }
  }

  formatCurrentOption(container) {
    return {
      value: container.name, 
      label: `${container.image.current.repository} : ${container.image.current.tag}`
    }
  }

  render() {
    const {workload} = this.props;
    const {selectedContainer, selectedImage} = this.state;

    // let images = null;
    // if(activeContainer) {
    //   images = activeContainer.Image.Available.map(img => this.formatOption(img));
    // }

    let activeContainer = workload.containers.find(container => container.image.current.id === selectedContainer);
    let imageSelectSize = 5;
    let images = null;
    if(activeContainer) {
      imageSelectSize = activeContainer.image.available.length < imageSelectSize ? activeContainer.image.available.length : imageSelectSize;
      
      images = activeContainer.image.available.map(image => 
        <option key={image.id} value={image.id}>{image.id}</option> 
      );
    }

    let autoReleaseNote = null;
    if(workload.automated) {
      autoReleaseNote = (
        <p style={{fontWeight: "bold", fontSize: "12px"}}>
          Note: This Workload is automated. When executed, the Workload will be Locked to prevent Flux from automatically replacing Docker image with latest available. Execute a Unlock to get back to previous state.
        </p>
      );
    }
    return (
      <React.Fragment>
        <div className="overlay"></div>
        <div className="modal">
          <div className="manual-release-dialog">
            <h1>Manual Release</h1>
            <div>
              <label htmlFor="container">Docker container to update:</label>
              <select name="container" className="modal-select" onChange={this.handleContainerChange} value={selectedContainer}>
                { workload.containers.map(container => 
                  <option key={container.image.current.id} value={container.image.current.id}>{container.name}</option> 
                )}
              </select>
              <p>
                Replace Docker image:
              </p>
              <p>
                <i className="fas fa-dice-d6" style={{color: "gray"}} />&nbsp;{activeContainer ? activeContainer.image.current.id : ""}
              </p>
          </div>
            <p>
              <label htmlFor="image">With Docker image:</label>
              <select name="image" size={imageSelectSize} className="modal-select" onChange={this.handleImageChange} value={selectedImage}>
                {images}
              </select>
            </p>
            {autoReleaseNote}
            {/* <div>
              <label htmlFor="image">New version / tag:</label>
              <Select name="image" className="modal-select"
                components={animatedComponents} 
                value={selectedImageItem}
                onChange={this.handleImageChange}
                // defaultValue={ this.formatOption(container.Image.Current) } 
                options={images}
               />
            </div> */}
            <div className="modal-buttons">
              <button className="btn-cancel" onClick={this.props.onClose }>Cancel</button>
              <button className="btn-ok" onClick={this.handleDeploy}>Deploy</button>
            </div>
          </div>
        </div>
      </React.Fragment>
    );


    // return (
    //   <td>
    //     {this.props.containers.}
    //     {/* <span style={{wordBreak: "keep-all", wordWrap: "none", whiteSpace: "nowrap"}}>Current: {this.props.container ? this.props.container.Image.Current.Tag : ""}</span>
    //     <p>Latest : {workload.Containers ? workload.Containers[0].Image.Latest.Tag : ""}</p> */}
    //   </td>
    // );
  }
}
