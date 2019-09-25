import React from 'react';
import './App.css';
import './workloads.css';
import Workload from './Workload';
import WorkloadFilter from './WorkloadFilter';
import ReconnectingWebSocket from 'reconnecting-websocket';
import superagent from 'superagent';
import ReactNotification, { store as notificationStore } from 'react-notifications-component'
import 'react-notifications-component/dist/theme.css'

let wsClient;

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      workloads: [],
      workloadFilter: null,
      isLoading: false,
    };
  }

  componentDidMount() {
    wsClient = new ReconnectingWebSocket('ws://localhost:8001/api/v1/namespaces/spv-system/services/gitops-flux-agent/proxy/');//'ws://localhost:3001'

    wsClient.onopen = () => {
      console.log('WebSocket Client Connected');
    };
  
    wsClient.onerror = (event) => {
      console.error("WebSocket error: ", event);
    }
    
    wsClient.onmessage = (message) => {
      if(message && message.data) {
        let obj = JSON.parse(message.data);
  
        switch(obj.object) {
          case 'workload':
            console.log(message.data);
            return this.updatePartialState(obj.diffData.new);
          case 'image': 
            return;
          case 'complete':
            console.log(message.data);
            this.setState({workloads: obj.workloads})
            break;
          default:
            break;
        }
      }
    };
  
    // this.updateData();

    // .catch(error => this.setState({ error }));
  }

  updateData() {
    this.setState({ isLoading: true });

    fetch('api/workloads')
      .then(response => {
        return response.json()
      })
      .then(data => {
        this.setState({ workloads: data, isLoading: false })
      });
  }

  updateDataPartially(id) {
    // this.setState({ isLoading: true });    
    fetch(`api/workload?id=${id}`)
      .then(response => {
        return response.json()
      })
      .then(data => {
        this.updatePartialState(data);
        // this.setState({ isLoading: false });
      });
  }

  updatePartialState(data) {
    console.log(`Doing partial update with workload ${data.id}`);

    this.setState(state => {
      let workloads = state.workloads.map(wl => {
        if(wl.id === data.id) {
          console.log(`Replacing old ${data.id}`);
          return data;
        }
        else {
          return wl;
        }
      }); 

      return {workloads: workloads};
    });
  }

  forceSync() {
    console.log(`${new Date()} - starting sync...`);
    superagent
    .post('/api/manual-sync')
    .end((err, res) => {
      if(err) {
        console.error(err);
        return;
      }

      if(!res.ok) {
        console.error(res.status);
        return;
      }

      notificationStore.addNotification({
        title: "Sync result",
        message: "res.body",
        type: "success",
        insert: "bottom",
        container: "bottom-right",
        animationIn: ["animated", "fadeIn"],
        animationOut: ["animated", "fadeOut"],
        dismiss: {
          duration: 5000,
          onScreen: true
        }
      });

      console.log(`${new Date()} - job finished...`);
      console.log(res.body);
    });
  }

  render() {
    const { workloads, workloadFilter, isLoading } = this.state;

    if (isLoading) {
      return (
        <div style={{width: "100%", textAlign: "center", margin: "0 auto", verticalAlign: "middle"}}>
          <div className="lds-ellipsis"><div></div><div></div><div></div><div></div></div>
        </div>
      );
    }

    if (!Array.isArray(workloads)) {
      return (
        <div style={{width: "100%", textAlign: "center", margin: "0 auto", verticalAlign: "middle"}}>
          <h2>No data</h2>
        </div>
      );
    }

    let activeWorkloads = workloads;
    if(workloadFilter) {
      activeWorkloads = workloads.filter(wl => {
        return wl.name.includes(workloadFilter) || wl.namespace.includes(workloadFilter) 
      });
    }

    activeWorkloads.sort((a,b) => {
      if(a.namespace > b.namespace){
        return 1;
      }
      else if(b.namespace > a.namespace) {
        return -1
      } 
      else {
        if(a.name > b.name) {
          return 1;
        }
        else if(b.name > a.name) {
          return -1;
        }
      }
      return 0;
    });

    return (
      <React.StrictMode>
        <div style={{margin: "10px"}}>
          <ReactNotification isMobile={true} />
          <div className="top-bar">
            <WorkloadFilter workloads={workloads} onFilter={(filter) => this.setState({workloadFilter: filter})} />
            <button className="button-action" onClick={this.forceSync}>Force Flux sync</button>
          </div>
          <table className="outer-table">
            <tbody>
            {
              activeWorkloads.map(workload =>
                <Workload key={workload.id} workload={workload} />
              )
            }
            </tbody>
          </table>
        </div>
      </React.StrictMode>
    );
  }
}
