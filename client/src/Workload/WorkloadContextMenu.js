import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisV } from '@fortawesome/free-solid-svg-icons';

export default class WorkloadContextMenu extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      activeContext: false,
      activeDialog: false,
    };

    this.showMenu = this.showMenu.bind(this);
    this.onMenuItemClick = this.onMenuItemClick.bind(this);
  }

  showMenu(e) {
    e.preventDefault();
    const {activeContext} = this.state;

    this.setState({activeContext: activeContext ? false : true});
  }

  onMenuItemClick(action) {
    const {workload} = this.props;

    if(action === 'manual-release') {
      if(this.props.onRelease) {
        this.props.onRelease(workload);
        return;
      }
    }

    if(this.props.onClick) this.props.onClick(action, workload);
  }

  render() {
    const {activeContext} = this.state;
    const {workload} = this.props;

    let menuContent = [{
      headline: 'Manual Release',
      description: 'Manually release specific version of container image. Will automatically lock workload to prevent Flux from autoreleasing latest image.',
      action: 'manual-release'
    }];

    if(workload.fluxState.automated) {
      menuContent.push({
        headline: 'De-automate',
        description: 'Turn off automation of deployment.',
        action: 'de-automate'
      });
    }
    else {
      menuContent.push({
        headline: 'Automate',
        description: 'Turn on automation of deployment.',
        action: 'automate'
      });
    }

    if(workload.fluxState.locked) {
      menuContent.push({
        headline: 'Unlock',
        description: 'Unlock and allow deployment of this workload.',
        action: 'unlock'
      });
    }
    else {
      menuContent.push({
        headline: 'Lock',
        description: 'Lock and prevent any deployment of this workload.',
        action: 'lock'
      });
    }

    let menu = null;
    if(activeContext) {
      menu = (
        <ul className="action-context-menu">
          {menuContent.map((item, index) => (
          <li key={index} onClick={() => this.onMenuItemClick(item.action)}>
            <h1>{item.headline}</h1>
            <p>{item.description}</p>
          </li>
          ))}
        </ul>
      );
    }

    return (
      <React.Fragment>
        <td style={{fontSize: "16px", cursor: "pointer"}} onClick={this.showMenu}>
          <FontAwesomeIcon icon={faEllipsisV} />
          {menu}
        </td>
      </React.Fragment>
  );
  }
}
