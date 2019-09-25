export const createPolicySpec = (id, action, enabled) => {
  let tmpl = {
    type: 'policy',
    cause: {
      message: `Setting ${action} to ${enabled}`,
      user: 'flux-dashboard'
    },
    spec: {
    }
  }

  tmpl.spec[id] = {};
  tmpl.spec[id][enabled ? 'add' : 'remove'] = {};
  tmpl.spec[id][enabled ? 'add' : 'remove'][action] = 'true';
  return tmpl;
};

export const createImageSpec = (workloadId, imageId) => {
  return {
    type: 'image',
    cause: {
      message: 'Manual release from Flux Dashboard',
      user: 'flux-dashboard'
    },
    spec: {
      serviceSpecs: [ //resource ID or "<all>"
        workloadId
      ],
      imageSpec: imageId, // or "<all latest>"
      kind: "execute", //or plan
      excludes: [], //resource IDs
      force: false,
    }
  };
};

export const createSyncSpec = () => {
  return {
    type: "sync",
    cause: {
      message: "Manual sync triggered from Flux Dashboard",
      user: "flux-dashboard"
    },
    spec: { }
  };  
}