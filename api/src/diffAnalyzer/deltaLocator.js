import {createHash, differ} from './helper';
import {mapWorkload, mapImage, mapContainersToWorkload} from '../dataMapper';

const fieldsToCheck = {
  workloads: [
    'Rollout',
    'Status',
    'SyncError',
    'Automated',
    'Locked',
    'Ignore',
    'Policies',
  ],
  images: [
    'Current',
    'LatestFiltered',
    'AvailableImagesCount',
    'NewAvailableImagesCount',
    'FilteredImagesCount',
    'NewFilteredImagesCount',
    'AvailableError',
  ]
};

export function findDeltas(newData, oldData, cb) {
  findDeltasInWorkloads(newData.workloads, oldData.workloads, (err, workloadDiffs) => {
    if(err) return cb(err);

    findDeltasInImages(newData.images, oldData.images, (err, imageDiffs) => {
      if(err) return cb(err);

      cb(null, workloadDiffs.concat(imageDiffs));
    });
  });
}

function findDeltasInWorkloads(newWorkloads, oldWorkloads, cb) {
  let messages = [];

  newWorkloads.forEach(newWorkload => {
    let oldWorkload = oldWorkloads.find(old => old.ID === newWorkload.ID);

    if(oldWorkload) {
      fieldsToCheck.workloads.forEach(field => {
        if(differ(oldWorkload[field], newWorkload[field])) {
          messages.push(createMessage('diff', 'workload', mapWorkload(oldWorkload), mapWorkload(newWorkload), newWorkload.ID));
        }
      });
    }
    else {
      messages.push(createMessage('new', 'workload', null, mapWorkload(newWorkload), newWorkload.ID));
    }
  });
  cb(null, messages);
}

function findDeltasInImages(newImages, oldImages, cb) {
  let messages = [];

  newImages.forEach(newImage => {
    let oldImage = oldImages.find(oldImage => oldImage.ID === newImage.ID);

    if(newImage && newImage.Containers && newImage.Containers.length > 0) {
      newImage.Containers.forEach(newContainer => {
        let oldContainer = oldImage.Containers.find(oldContainer => oldContainer.Name === newContainer.Name);
        fieldsToCheck.images.forEach(field => {
          if(differ(oldContainer[field], newContainer[field])) {
            messages.push(createMessage('diff', 'image', mapImage(oldImage), mapImage(newImage), newImage.ID));
          }
        });
      });
    }
    else {
      messages.push(createMessage('new', 'image', null, newImage, newImage.ID));
    }
  });

  cb(null, messages);
}

function createMessage(type, object, oldFieldData, newFieldData, id) {
  let message = {
    type: type,
    object: object,
    detectedAt: new Date(),
    diffData: {
      old: oldFieldData,
      new: newFieldData
    }
  };
  message['id'] = id;
  return message;
}