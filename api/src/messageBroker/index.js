import expressWs from 'express-ws';
import ws from 'ws';

export default class MessageBroker {
  constructor(wsServer) {
    this.wsServer = wsServer;
  }

  publish(message) {
    console.log(message);

    this.broadcast(message, (err, status) => {
      return;
    });
  }

  broadcast(message, cb) {
    try {
      this.wsServer.clients.forEach(client => {
        if (client.readyState === ws.OPEN) {
          client.send(JSON.stringify(message));
        }
      });
      return cb(null, "success");
    }
    catch(ex) {
      cb(ex);
    }
  }

  publishWorkloadChanged(workload, cb) {
    const msg = createMessage('update', 'workload', null, workload, workload.id);
    this.broadcast(msg, cb);
  }

  publishKubeStateChanged(id, state, cb) {
    this.broadcast({object: 'kubestate', id: id, state: state}, cb);
  }

  publishWorkloadsRefreshed(workloads, cb) {
    this.broadcast({object: 'complete', workloads: workloads}, cb);
  }
}

export function createMessage(type, object, oldFieldData, newFieldData, id) {
  return {
    id: id,
    type: type,
    object: object,
    detectedAt: new Date(),
    diffData: {
      old: oldFieldData,
      new: newFieldData
    }
  };
}