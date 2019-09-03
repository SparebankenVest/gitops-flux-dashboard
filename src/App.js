import React from 'react';
import './App.css';
import './workloads.css';
import ImageDescription from './Images';
import StatusLabel from './StatusLabel.js';
import FluxStatus from './FluxStatus.js';
import FluxOperations from './FluxOperations';

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      workloads: [],
      error: null,
      res: null,
      isLoading: false,
    };
  }

  componentDidMount() {
    this.setState({ isLoading: true });

    fetch('api/v1/namespaces/spv-system/services/spv-flux-gitops:3030/proxy/api/flux/v11/services')
      .then(response => {
        return response.json()
      })
      .then(data => {
        this.setState({ workloads: data, isLoading: false })
      });
      // .catch(error => this.setState({ error }));
  }

  render() {
    const { workloads, isLoading } = this.state;
    
    if (isLoading) {
      return (
        <div style={{width: "100%", textAlign: "center", margin: "0 auto", verticalAlign: "middle"}}>
          <div className="lds-ellipsis"><div></div><div></div><div></div><div></div></div>
        </div>
      );
    }

    let records = workloads.filter(workload => !workload.ID.includes(":helmrelease/")).map(workload => {
      let record = {};

      if(workload.Containers) {
        workload.Containers.forEach(container => {
          // let newer = container.NewAvailableImagesCount > 0 ? container.Available.slice(0, container.NewAvailableImagesCount - 1).map(newer => {
          //   return newer.ID;
          // }) : null;
  
          let splitIndex = container.Current.ID.lastIndexOf(":");
          let imageName = container.Current.ID.substring(0, splitIndex);
          let imageTag = container.Current.ID.substring(splitIndex + 1, container.Current.ID.length);

          record = {
            id: workload.ID,
            namespace: workload.ID.split(":")[0],
            type: workload.ID.split(":")[1].split("/")[0],
            name: workload.ID.split(":")[1].split("/")[1],
            status: workload.Status,
            automated: workload.Automated,
            locked: workload.Locked,
            ignore: workload.Ignore,
            policies: workload.Policies,
            container: {
              name: container.Name,
              current: {
                id: container.Current.ID,
                imageName: imageName,
                imageTag: imageTag
              },
            },
          };
        });
        }
      return record;
    });

    records.sort((a,b) => (a.namespace > b.namespace) ? 1: ((b.namespace > a.namespace) ? -1 : 0));

    return (
      <div style={{margin: "10px"}}>
        <table>
          <tbody>
          {
            records.map(record =>
              <tr key={record.id}>
                <td style={{width: "20px"}}>
                  <StatusLabel status={record.status} />
                  {/* <FluxOperations /> */}
                </td>
                <td style={{width: "20px"}}><FluxStatus workload={record}/></td>
                <td>{record.namespace}</td>
                <td style={{width: "99%"}}><ImageDescription container={record.container}/></td>
                <td>
                  <span style={{wordBreak: "keep-all", wordWrap: "none", whiteSpace: "nowrap"}}>Current: {record.container.current.imageTag}</span>
                  <p>Latest : {record.container.current.imageTag}</p>
                </td>
                <td style={{fontSize: "16px"}}><i className="fas fa-ellipsis-v" ></i></td>
              </tr>
            )
          }
          </tbody>
        </table>
      </div>
    );
  }
}
