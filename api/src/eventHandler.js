/*
  Actions in Flux is triggered in two ways:
    1) by a manual change in the Git repository (a commit) 
       monitored by Flux, or 
    2) a post to the Flux API update-manifests endpoint, 
       which will trigger Flux to do a Git commit to the 
       same repository.

  No matter which, Flux will handle the change in its Sync 
  process and apply the change to the Kubernetes cluster.

  Example flows:

    Triggering a manual release through the Flux API,
    the following events will trigger:
      1. Commit
      2. Sync
      3. Release

    Triggering a lock/unlock operation through the Flux API,
    the following events will trigger:
      1. Commit
      2. Sync
    (Note: Since this is a Flux specific operation, no changes
           will be applied to Kubernetes)

*/
const handleEvent = (event, cb) => {
  if(!event) return;

  switch(event.type) {
    case 'kubernetesupdate':
      return detectNeededKubernetesUpdates(event, cb);
    case 'commit':
      return detectNeededUpdates(event, cb);
    case 'sync':
      return detectNeededUpdates(event, cb);
    case 'release':
      return detectNeededUpdates(event, cb);
    case 'autorelease':
      return detectNeededUpdates(event, cb);
    case 'automate':
      return detectNeededUpdates(event, cb);
    case 'deautomate':
      return detectNeededUpdates(event, cb);

    // Are these relevant?
    case 'lock':
      return detectNeededUpdates(event, cb);
    case 'unlock':
      return detectNeededUpdates(event, cb);
    case 'update_policy':
      return detectNeededUpdates(event, cb);
    case 'other':
      return detectNeededUpdates(event, cb);
    default:
      return cb(null, null);
  }
};

const detectNeededKubernetesUpdates = (event, cb) => {
  if(event.metadata && event.serviceIDs && event.serviceIDs.length > 0) {
    return cb(null, updates(null, {id: event.serviceIDs[0], state: event.metadata}));
  }
  cb(null, updated(null, null));
};

const detectNeededUpdates = (event, cb) => {
  // Check all flux operations
  let revision = event.metadata.revision;
  let result = event.metadata.result;

  if(result) {
    let updatesNeeded = [];
    Object.keys(result).forEach(key => {
      if(result[key].Status === "success") {
        updatesNeeded.push(key);
      }
    });

    return cb(null, updates(updatesNeeded, null));
  }

  cb(null, updated(null, null));
}

const updates = (refreshIDs, kubeUpdate) => {
  return {
    outdatedWorkloads: refreshIDs,
    kubeUpdate: kubeUpdate,
  }
}

export default handleEvent;