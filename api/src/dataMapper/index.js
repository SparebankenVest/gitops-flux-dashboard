import semver from 'semver';

export function mapWorkload(workload) {
  let result = workload.ID.match(/(.*):(.*)\/(.*)/);
  let policyTagKeys = Object.keys(workload.Policies).filter(key => key.startsWith("tag."));

  return {
    id: workload.ID,
    name: result[3],
    namespace: result[1],
    type: result[2],
    managedByHelm: workload.Antecedent ? workload.Antecedent.includes(':helmrelease/') : false,
    fluxState: {
      automated: workload.Automated,
      locked: workload.Locked,
      ignore: workload.Ignore,
    },
    kubernetesState: {
      status: workload.Status,
      rollout: {
        desired: workload.Rollout.Desired,
        updated: workload.Rollout.Updated,
        ready: workload.Rollout.Ready,
        available: workload.Rollout.Available,
        outdated: workload.Rollout.Outdated,
        errors: workload.Rollout.Messages,
      }
    },
    labels: workload.Labels,
    policy: {
      tags: policyTagKeys.map(key => {
        return {
          key: key.replace('tag.', ''),
          value: workload.Policies[key],
        }
      })
    }
  };
}

export function mapImage(image) {
  return {
    id: image.ID,
    containers: mapContainerCollectionFields(image.Containers, null)
  }
}

export function mapContainersToWorkload(workload, containers) {
  workload.containers = containers.map(container => {
    let tag = workload.policy.tags.find(tag => tag.key === container.Name);
    let tagPolicy = "";
    if(tag) {
      tagPolicy = tag.value;
    }
    let available = filterAvailableImages(container.Available, container.Name, tagPolicy);

    return {
      name: container.Name,
      image: {
        current: mapContainerFields(container.Current, tagPolicy),
        latest: mapContainerFields(container.LatestFiltered, tagPolicy),
        newAvailableImagesCount: container.NewAvailableImagesCount,
        newFilteredImagesCount: container.NewFilteredImagesCount,
        available: available,
        newer: filterNewerImages(container.Current, available, tagPolicy),
      }
    };
  });
}

function mapContainerCollectionFields(containers, tagPolicy) {
  return containers.map(availableContainer => {
    return mapContainerFields(availableContainer, tagPolicy);
  });
}

function mapContainerFields(image, tagPolicy) {
  let imageParts = getImageParts(image.ID);

  return {
    id: image.ID,
    registry: imageParts.registry,
    namespace: imageParts.namespace || "",
    repository: imageParts.repository,
    tag: imageParts.tag,
    tagPolicy: tagPolicy ? tagPolicy : "",
    labels: image.Labels,
    createdAt: image.CreatedAt,
    lastFetched: image.LastFetched,
  };
}

function filterAvailableImages(images, containerName, tagPolicy) {
  if(!images) {
    return [];
  }

  if(tagPolicy) {
    let filtered = images.filter(availableContainer => {
      let imageParts = getImageParts(availableContainer.ID);

      if(tagPolicy.startsWith('regexp:', 0) || tagPolicy.startsWith('regex:', 0)) {
        let regexpPolicy = tagPolicy.replace("regexp:", "").replace("regex:");
        const regex = new RegExp(regexpPolicy, 'g');
        return imageParts.tag.match(regex) != null;
      }
      else if(tagPolicy.startsWith('semver:', 0)) {
        let semverPolicy = tagPolicy.replace("semver:", "");
        return semver.satisfies(imageParts.tag, semverPolicy);
      } else {
        return false;
      }
    });

    if(filtered) {
      return mapContainerCollectionFields(filtered, tagPolicy);
    }
  }

  if(images) return mapContainerCollectionFields(images);
  return [];
}

function filterNewerImages(current, available) {
  if(!available || available.length == 0) {
    return [];
  }
  if(available[0].ID === current.ID) {
    return [];
  }

  let counter = 0;
  for (let index = 0; index < available.length; index++) {
    const element = available[index];
    if(element.ID === current.ID) {
      return available.slice(0, index);
    }
  }
  return [];
}

function getImageParts(image) {
  if(!image) return {};

  let match = image.match(/^(?:([^\/]+)\/)?(?:(.*)\/)*([^@:\/]+)(?:[@:](.+))?$/);
  if(!match) return {};

  return {
    registry: match[1],
    namespace: match[2],
    repository: match[3],
    tag: match[4]
  };
}
