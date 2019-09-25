import express from 'express';
import expressWs from 'express-ws';
import bodyParser from 'body-parser';
import superagent from 'superagent';
import urlJoin from 'url-join';
import Cache  from 'node-cache';
import fs from 'fs';
import {createLogger, format, transports} from 'winston';
import dbg from 'debug';

import { exec } from 'child_process';
import FluxDataService from './fluxDataService';
import MessageBroker from './messageBroker';
import EventStore from './eventStore';
import handleEvent from './eventHandler';
import fluxApiClient from './fluxApiClient';

const debug = dbg('flux-dashboard-daemon');

const { combine, timestamp, label, align, printf, simple, splat, prettyPrint, level } = format;

const rawParser = bodyParser.raw({
  type: 'application/*+json'
});

const log = createLogger({
  level: 'info',
  format: combine(
    label({label: 'flux-dashboard'}),
    timestamp(),
    printf(({ level, message, label, timestamp }) => {
      return `${timestamp} [${label}] ${level}: ${message}`;
    })
  ),
  transports: [
    new transports.Console()  
  ],
});

const port = process.env['PORT'] || 3001;
const fluxApiRoot = process.env["FLUX_API_ROOT"] || 'http://localhost:8001/api/v1/namespaces/spv-system/services/spv-flux-gitops:3030/proxy/api/flux';
const maxEvents = process.env["MAX_EVENTS"] ? parseInt(process.env["MAX_EVENTS"]) : 500;
const fluxPollInterval = process.env["FLUX_POLL_INTERVAL"] ? parseInt(process.env["FLUX_POLL_INTERVAL"]) : 320;
const fluxMaxDataSize = process.env["FLUX_MAX_DATA_SIZE"] ? parseInt(process.env["FLUX_MAX_DATA_SIZE"]) : 5;
const fluxPollDiffs = process.env["FLUX_POLL_DIFFS"] ? parseInt(process.env["FLUX_POLL_DIFFS"]) : false;

console.log('Env values:');
console.log(`  PORT               = ${port}`);
console.log(`  FLUX_API_ROOT      = ${fluxApiRoot}`);
console.log(`  FLUX_POLL_INTERVAL = ${fluxPollInterval}`);
console.log(`  FLUX_MAX_DATA_SIZE = ${fluxMaxDataSize}`);
console.log(`  MAX_EVENTS         = ${maxEvents}`);
console.log();

const app = express();
app.use(express.json({
  limit: `${fluxMaxDataSize}mb`
}));
const ws = expressWs(app);

const messageBroker = new MessageBroker(ws.getWss());

const eventStore = new EventStore({
  maxEvents: maxEvents
});

const fluxClient = fluxApiClient(fluxApiRoot);
const dataService = new FluxDataService(fluxPollInterval, messageBroker, fluxPollDiffs, fluxClient);

app.ws('/', (ws, req) => {
  ws.on('message', (msg) => {
    log.info(msg);
  });

  ws.send(JSON.stringify({
    object: 'complete',
    workloads: dataService.getWorkloads()
  }));

  log.info('socket', req.testing);
});

app.get('/ping', (req, res) => {
  log.debug('ping received');
  return res.sendStatus(200);
});

app.post('/', (req, res) => {
  try {
    if(req.body) {
      let event = req.body.Event;

      if(event) {
        log.info(`Flux event of type '${event.type}' received`);

        handleEvent(event, (err, changes) => {
          if(err) {
            debug('%O', err);
          }

          if(changes.kubeUpdate) {
            dataService.updateWorkloadWithKubeState(kubeUpdate.id, kubeUpdate.state, (err, workload) => {
              if(err) {
                return debug('%O', err);
              }
            
              messageBroker.publishKubeStateChanged(kubeUpdate.id, kubeUpdate.state, (err, status) => {
                if(err) {
                  return debug('%O', err);
                }

                log.info(`Broadcasted updates to kubestate for ${kubeUpdate.id}`);
              });
            })            
          }

          if(changes.outdatedWorkloads) {
            changes.outdatedWorkloads.forEach(id => {
              log.info(`Updating workload ${id}`);
  
              dataService.updateWorkload(id, (err, workload) => {
                if(err) {
                  return debug('%O', err);
                }
              
                messageBroker.publishWorkloadChanged(workload, (err, status) => {
                  if(err) {
                    return debug('%O', err);
                  }
  
                  log.info(`Broadcasted updates to workload ${workload.id}`);
                });
              });
            });
          }
        });

        eventStore.write(event);
      }
    }
  }
  catch(err) {
    log.error(err.message);
    return res.sendStatus(500);
  }

  return res.sendStatus(200);
});

app.get('/events', (req, res) => {
  res.json(eventStore.json());
});

function executeAction(req, res, action) {
  if(!req.body) {
    return res.status(400).send("No content in body");
  }

  if(!req.body.id || !req.body.hasOwnProperty("enabled")) {
    return res.status(400).send('Body must include "id" and "enabled"');
  }

  log.info(`Setting workload ${req.body.id} action ${action} to ${req.body.enabled}`);

  let operation;
  switch(action) {
    case 'locked':
      operation = req.body.enabled ? fluxClient.lockWorkload : fluxClient.unlockWorkload;
      break;
    case 'automated':
      operation = req.body.enabled ? fluxClient.automateWorkload : fluxClient.deautomateWorkload;
      break;
    default:
      operation = null;
      break;
  }

  if(operation) {
    operation(req.body.id, (err, response) => {
      if(err) {
        log.error(err);
        debug('%O', err);
        return res.status(500).json({error: err.message});
      }
      return res.status(200).json(response);
    });
  }
  else {
    return res.status(400).json({message: "operation not supported"});
  }
}

app.post('/api/workload/ignore', (req, res) => executeAction(req, res, 'ignore'));
app.post('/api/workload/lock', (req, res) => executeAction(req, res, 'locked'));
app.post('/api/workload/automate', (req, res) => executeAction(req, res, 'automated'));

app.post('/api/manual-sync', (req, res) => {
  fluxClient.manualSync((err, result) => {
    if(err) {
      log.error(err);
      debug('%O', err);
      return res.status(500).json({error: err.message});
    }

    console.log(result);
    return res.status(200).json(result);
  });
});

app.get('/api/workloads', (req, res) => {
  return res.json(dataService.getWorkloads());
});

app.get('/api/workloads/namespace/:namespace', (req, res) => {
  return res.json(dataService.getWorkloads.filter(workload => workload.namespace === req.params.namespace));
});

app.get('/api/workload', (req, res) => {
  return res.json(dataService.getWorkload(req.query["id"]));
});

app.post('/api/workload/release', (req, res) => {
  if(!req.body) {
    return res.status(400).send("No content in body");
  }

  if(!req.body.workloadId || !req.body.imageId) {
    return res.status(400).send('Body must include "workloadId" and "imageId"');
  }

  // spec := update.ReleaseImageSpec{
  //   ServiceSpecs: workloads,
  //   ImageSpec:    image,
  //   Kind:         kind,
  //   Excludes:     excludes,
  //   Force:        opts.force,
  // }
  // jobID, err := opts.API.UpdateManifests(ctx, update.Spec{
  //   Type:  update.Images,
  //   Cause: opts.cause,
  //   Spec:  spec,
  // })

  let spec = {
    type: 'image',
    cause: {
      message: 'Manual release from Flux Dashboard',
      user: 'flux-dashboard'
    },
    spec: {
      serviceSpecs: [ //resource ID or "<all>"
        req.body.workloadId
      ],
      imageSpec: req.body.imageId, // or "<all latest>"
      kind: "execute", //or plan
      excludes: [], //resource IDs
      force: false,
    }
  }

  let specUrl = urlJoin(fluxApiRoot, '/v9/update-manifests');

  log.info(JSON.stringify(spec));
  superagent
    .post(specUrl)
    .send(spec)
    .then(apiRes => {
      if(!apiRes.ok) {
        return res.status(500).json({error: "failed"});
      }

      executeAction2(req.body.workloadId, 'locked', true, (err, lockRes) => {
        if(err) {
          log.error(err);
          return res.status(500).json({error: err.message});
        }
        if(!lockRes.ok) {
          return res.status(500).json({error: "failed"});
        }
        return res.status(200).json({
          deployJob: apiRes.body,
          lockJob: lockRes.body
        });
      });
    })
    .catch(err => {
      log.error(err);
      return res.status(500).json({error: err.message});
  });
});

log.info('Starting server...');
log.info('Getting initial data from Flux Daemon...');

let running = false;
dataService.start(eventStore, (err, data) => {
  if(err) {
    throw err;
  }

  if(!running) {
    app.listen(port, () => log.info(`Listening on port ${port}`));
    log.info('Server started.');
    running = true;
  }

  log.info('Flux Daemon data updated');
});