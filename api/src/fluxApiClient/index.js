import superagent from 'superagent';
import urlJoin from 'url-join';
import {createPolicySpec, createImageSpec, createSyncSpec} from './policySpecs';

const containerFields = 'Name,Current,LatestFiltered,AvailableError,AvailableImagesCount,NewAvailableImagesCount,FilteredImagesCount,NewFilteredImagesCount';
let fluxApiRoot;

export default (fluxRoot) => {
  fluxApiRoot = fluxRoot;

  return {
    getVersion: cb => get('/v11/version', cb),

    getWorkloads: cb => get('/v11/services', cb),
    getWorkload: (name, cb) => {
      get(`/v11/services?services=${name}`, (err, workloads) => {
        if(err) return cb(err);

        if(workloads && workloads.length > 0) {
          return cb(null, workloads[0]);
        } 
        else {
          cb(null, null);
        }
      });
    },

    getAllAvailableImages: cb => get('/v6/images', cb), 
    getAllCurrentAndLatestImages: cb => get(`/v6/images?containerFields=${containerFields}`, cb),
    getImagesForWorkload: (workload, cb) => get(`/v6/images?service=${workload}`, cb),
    getCurrentAndLatestImagesForWorkload: (workload, cb) => get(`/v6/images?service=${workload}&containerFields=${containerFields}`, cb),
    
    lockWorkload: (workload, cb) => executeJob(createPolicySpec(workload, 'locked', true), cb),
    unlockWorkload: (workload, cb) => executeJob(createPolicySpec(workload, 'locked', false), cb),
    automateWorkload: (workload, cb) => executeJob(createPolicySpec(workload, 'automated', true), cb),
    deautomateWorkload: (workload, cb) => executeJob(createPolicySpec(workload, 'automated', false), cb),
    manualSync: (cb) => executeJob(createSyncSpec(), cb),
  };
};

const executeJob = (spec, cb) => {
  post('/v9/update-manifests', spec, cb);
};

const getJob = (jobId, cb) => {
  get(`v6/jobs?id=${jobId}`, cb);
}

// const awaitJob = (jobId, cb) => {
//   job(cb)
// };

const get = (url, cb) => {
  let servicesUrl = urlJoin(fluxApiRoot, url);
  superagent
  .get(servicesUrl)
  .end((err, apiRes) => {
    if(err) return cb(err);

    if(!apiRes.ok) {
      return cb('Status code was not ok');
    } 

    cb(null, apiRes.body);
  });
}

const post = (url, spec, cb) => {
  let servicesUrl = urlJoin(fluxApiRoot, url);
  superagent
  .post(servicesUrl)
  .send(spec)
  .end((err, apiRes) => {
    if(err) return cb(err);

    if(!apiRes.ok) {
      return cb('Status code was not ok');
    } 

    cb(null, apiRes.body);
  });
}


