import { create } from 'domain';
import winston from 'winston';
import {mapWorkload, mapContainersToWorkload} from '../dataMapper';
/*
  -- Correlation --

  Correlate Flux Workloads with Flux Images.
  
  -- Triggering events for diffs --

  We hash certain data sets in order to discover diffs 
  between syncs with Flux, and trigger events for these
  diffs.

  The following data sets are monitored:

  Workload:
   - Rollout (changes to status of Pods)
   - Status (if Status has changed)
   - Automated/Locked/Ignore (If workload status has changed)

   Images:
   - Current (If current Image has changed)
   - Latest (If latest Image has changed)

   For certain Flux events we trigger more frequent updates
   for specific Workloads, to pick up any changes quickly.
   Example is the Flux 'autorelease' event. When this triggers
   we poll for changes on the Workload in question more frequently,
   to pick up changes to Rollout, Status etc.
*/

const log = winston.loggers.get();

export default (rawFluxData, cb) => {
  if(!rawFluxData || !rawFluxData.workloads || !rawFluxData.images) return cb('No Flux data');
  
  try {
    let correlated = rawFluxData.workloads.filter(workload => !workload.ID.includes(":helmrelease/")).map(workload => {
      let mappedWorkload = mapWorkload(workload);

      let correlatedImage = rawFluxData.images.find((image) => image.ID === workload.ID);
      if(correlatedImage && correlatedImage.Containers && correlatedImage.Containers.length > 0) {
        mapContainersToWorkload(mappedWorkload, correlatedImage.Containers);
      }
      return mappedWorkload;
    });
    cb(null, correlated);
  }
  catch(err) {
    cb(err);
  }
}