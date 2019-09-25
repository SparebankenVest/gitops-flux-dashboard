import assert, { doesNotReject } from 'assert';
import {findDeltas} from '../src/diffAnalyzer/deltaLocator';

const oldData = {
  workloads: [
    {
      "ID": "namespace:deployment/container",
      "Containers": [
        {
          "Name": "container",
          "Current": {
            "ID": "mycontainer:17df40a",
            "Labels": {}
          },
          "LatestFiltered": {
            "ID": "",
            "Labels": {}
          }
        }
      ],
      "ReadOnly": "",
      "Status": "ready",
      "Rollout": {
        "Desired": 2,
        "Updated": 2,
        "Ready": 2,
        "Available": 2,
        "Outdated": 0,
        "Messages": null
      },
      "SyncError": "",
      "Antecedent": "",
      "Labels": {
        "app": "account",
        "fluxcd.io/sync-gc-mark": "sha256.VCN8B12F8Tw93vxe7SQ85SSAiY9KvQbkP__Bo91cGFc"
      },
      "Automated": true,
      "Locked": false,
      "Ignore": false,
      "Policies": {
        "automated": "true",
        "tag.account": "regexp:^\\w{7}(?:\\w)?$"
      }
    },
  ],
  images: [
    {
      ID: "namespace:deployment/container",
      Containers: [
        {
          Name: "container",
          Current: {
            ID: "mycontainer:17df40a",
            Digest: "sha256:1880e7e47a49d72b8b06222e12ba0ff4927f96765bbd50579a1a5f1e39db55fb",
            ImageID: "sha256:315386686e822a996283d18c331fc76b4c235eacfd1eceabf3bfd259390de334",
            Labels: {},
            CreatedAt: "2019-09-13T13:23:23.662878541Z",
            LastFetched: "2019-09-16T04:31:14.993145806Z"
          },
          LatestFiltered: {
            ID: "mycontainer:17df40a",
            Digest: "sha256:1880e7e47a49d72b8b06222e12ba0ff4927f96765bbd50579a1a5f1e39db55fb",
            ImageID: "sha256:315386686e822a996283d18c331fc76b4c235eacfd1eceabf3bfd259390de334",
            Labels: {},
            CreatedAt: "2019-09-13T13:23:23.662878541Z",
            LastFetched: "2019-09-16T04:31:14.993145806Z"
          },
          AvailableImagesCount: 923,
          NewAvailableImagesCount: 7,
          FilteredImagesCount: 279
        }
      ]
    },
  ]
};

describe('Diff', () => {
  it('detects diff for workload state', (done) => {
    let newData = JSON.parse(JSON.stringify(oldData));
    newData.workloads[0].Automated = false;

    findDeltas(newData, oldData, (err, events) => {
      if(err) return done(err);

      assert.equal(events.length, 1);
      console.log(events);
      done();
    });
  });
});

describe('Diff', () => {
  it('detects diff for image AvailableImagesCount', (done) => {
    let newData = JSON.parse(JSON.stringify(oldData));
    newData.images[0].Containers[0].AvailableImagesCount = 924;

    findDeltas(newData, oldData, (err, events) => {
      if(err) return done(err);

      assert.equal(events.length, 1);
      console.log(events);
      done();
    });
  });
});

