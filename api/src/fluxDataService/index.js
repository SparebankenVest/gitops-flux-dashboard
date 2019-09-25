import 'regenerator-runtime/runtime'; // for supporting async/await
import correlate from './correlator';
import DiffAnalyzerService from '../diffAnalyzer/service';
import {mapWorkload} from '../dataMapper';
import {createMessage} from '../messageBroker';
import { ETXTBSY } from 'constants';

let client = null;
let workloads = [];

let rawFluxData =  {
  workloads: [],
  images: []
};

let scheduledUpdates = [];
let messageBroker;
export default class FluxDataService {
  constructor(refreshIntervalInSeconds, msgBroker, pollDiffs, fluxClient) {
    client = fluxClient;
    messageBroker = msgBroker;
    this.refreshIntervalInSeconds = refreshIntervalInSeconds;
    this.started = false;
    this.pollDiffs = pollDiffs;
    this.diffService = new DiffAnalyzerService(60, client, this, messageBroker);
  }

  start(eventStore, cb) {
    this.started = true;
    updateFluxData(eventStore, (err, data) => {
      if(err) return cb(err);

      workloads = data;
      cb(err, data);

      if(this.pollDiffs) {
        this.diffService.start((err) => console.error(err));
      }

      setInterval(() => {
        this.scheduleUpdate(eventStore, cb);
      }, this.refreshIntervalInSeconds * 1000);
  
      setInterval(() => {
        processScheduler(eventStore);
      }, 30 * 1000);
    });
  }

  scheduleUpdate(eventStore, cb) {    
    scheduledUpdates.push(cb);
  }

  getWorkloads() {
    return workloads;
  }

  getWorkload(id) {
    return workloads.find(wl => wl.id === id);
  }

  getRawFluxData() {
    return rawFluxData;
  }

  updateWorkloadWithKubeState(id, state, cb) {
    let index = workloads.findIndex(old => old.id === id);
    if(index > -1) {
      let workload = workloads[index];
      workload.kubernetesState = state;
      let message = createMessage('', 'workload', null, workload, id);
      messageBroker.publish(message);
      return cb(null, workload);
    }
    return cb(null, null);
  }

  updateWorkload(id, cb) {
    client.getWorkload(id, (err, newWorkload) => {
      if(err) return cb(err);

      if(newWorkload) {
        let index = workloads.findIndex(old => old.id === id);
        if(index > -1) {
          let workload = mapWorkload(newWorkload)
          let containers = workloads[index].containers;
          workload.containers = containers;
          workloads[index] = workload;
          let message = createMessage('', 'workload', null, workload, id);
          messageBroker.publish(message);
          return cb(null, workload);
        }
      }
      return cb(null, null);
    });
  }

  updateWithDiff(message) {
    switch(message.object) {
      case 'workload':
        let index = workloads.findIndex(wl => wl.id === message.id);
        if(index > -1) {
          let containers = workloads[index].containers;
          workloads[index] = message.diffData.new;
          workloads[index].containers = containers;
        }
        return; 

      case 'image':
        return;

      default:
        return;
    }
  }
}

function processScheduler(eventStore) {
  if(scheduledUpdates.length === 0) return;

  updateFluxData(eventStore, (err, data) => {
    scheduledUpdates.forEach(requester => {
      requester(null, data);
    });
    scheduledUpdates = [];
  });
}

function updateFluxData(eventStore, cb) {
  Promise.all([
    new Promise((resolve, reject) => {
      client.getWorkloads((err, result) => {
        if(err) return reject(err);
        resolve(result);
      });
    }),
    new Promise((resolve, reject) => {
      client.getAllAvailableImages((err, result) => {
        if(err) return reject(err);
        resolve(result);
      });
    })
  ])
  .then((result) => {
    rawFluxData.workloads = result[0];
    rawFluxData.images = result[1];

    correlate(rawFluxData, (err, data) => {
      if(err) {
        return cb(err);
      }
  
      messageBroker.publishWorkloadsRefreshed(data, (err, status) => {
        if(err) return console.error(err);

        console.log(`Broadcasted refreshed workloads with status ${status}`);
      });

      return cb(null, data);
    });
  })
  .catch(error => cb(error) );
}
