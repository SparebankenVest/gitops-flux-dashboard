import React, { useState } from "react";
import StatusLabel from './StatusLabel';
import FluxStatus from './FluxStatus';
// import ContainerName from './ContainerName';
import ContainerDescription from './ContainerDescription';
import ContainerImageTagList from './ContainerImageTagList';
import WorkloadContextMenu from './WorkloadContextMenu';
import ManualRelease from './ManualRelease';

import superagent from 'superagent';

const Workload = ({workload}) => {
  const [showReleaseUi, setShowReleaseUi] = useState(false);

  const handleContextAction = (action, workload) => {
    console.log(`${action} on workload ${workload.id}`);

    let urlAction = (action) => {
      switch (action) {
        case 'de-automate':
          return {
            url: 'automate',
            enable: false
          };
        case 'automate':
          return {
            url: 'automate',
            enable: true
          };
        case 'unlock':
          return {
            url: 'lock',
            enable: false
          };
        case 'lock':
          return {
            url: 'lock',
            enable: true
          };
        default:
          console.error(`Operation ${action} not supported`);
          return;
      }
    }

    let urlData = urlAction(action);
    let url = `api/workload/${urlData.url}`;
    let spec = {
      id: workload.id,
      enabled: urlData.enable
    };

    superagent
    .post(url)
    .send(spec)
    .end((err, res) => {
      if(err) {
        console.error(err);
        return;
      }

      if(!res.ok) {
        console.error(res.status);
        return;
      }

      console.log(res.body);
    });
  };

  const handleDeploy = (workload, image) => {
    setShowReleaseUi(false);

    let url = 'api/workload/release';
    let spec = {
      workloadId: workload.id,
      imageId: image.id
    };

    superagent
    .post(url)
    .send(spec)
    .end((err, res) => {
      if(err) {
        console.error(err);
        return;
      }

      if(!res.ok) {
        console.error(res.status);
        return;
      }

      console.log(res.body);
    });
  };

  let releaseUi = null;
  if(showReleaseUi) {
    releaseUi = <ManualRelease workload={workload} onClose={() => setShowReleaseUi(false)} onDeploy={handleDeploy} />
  }

  const descriptionStyle = {
    fontWeight: "lighter", 
    fontSize: "12px", 
    paddingTop: "10px"
  };

  let helm = null;
  if(workload.managedByHelm) {
    helm = <p style={descriptionStyle}>Helm chart: {workload.labels.chart}</p>;
  }
  return (
    <tr key={workload.id}>
      <StatusLabel kubestate={workload.kubernetesState} />
      <td style={{width: "20px"}}><FluxStatus fluxState={workload.fluxState}/></td>
      <td style={{padding: "0px", margin: "0px", width: "99%"}}>
        <table className="inner-table">
          <tbody>
            <tr>
              <td colSpan="3">
                <h1>
                  { workload.managedByHelm ? <i><img src="helm.svg" alt="Helm Release" style={{width: "18px", marginBottom: "-3px", marginRight: "4px"}} /></i> : <i className="fas fa-dice-d6" style={{color: "gray", paddingRight: "5px"}}/>} {workload.namespace} / {workload.name}
                </h1>
                {helm}
                <p style={descriptionStyle}>
                  Type: {workload.type}
                </p>
              </td>
            </tr>
            {
              workload.containers.map(container => 
                <tr key={container.name} style={{marginLeft: "40px"}}>
                  {/* <ContainerName name={container.name} /> */}
                  <ContainerDescription container={container}  />
                  <ContainerImageTagList container={container} />
                </tr>
              )
            }
            {releaseUi}
          </tbody>
        </table>
      </td>
      <WorkloadContextMenu workload={workload} onClick={handleContextAction} onRelease={() => setShowReleaseUi(true)} />
    </tr>
  );
}

export default Workload;