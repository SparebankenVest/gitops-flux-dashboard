import {findDeltas} from './deltaLocator';

export default class DiffAnalyzerService {
  constructor(interval, fluxClient, dataService, messageBroker) {
    this.interval = interval;
    this.fluxClient = fluxClient;
    this.dataService = dataService;
    this.messageBroker = messageBroker;
    this.previousData = null;
  }

  start(cb) {
    this.previousData = this.dataService.getRawFluxData();
    
    setInterval(() => {
      Promise.all([
        this.fluxClient.getWorkloads(),
        this.fluxClient.getAllCurrentAndLatestImages()
      ])
      .then((result) => {
        let newData = {
          workloads: result[0],
          images: result[1].filter(image => !image.ID.includes(":helmrelease/"))
        };

        findDeltas(newData, this.previousData, (err, diffs) => {
          console.log(`Found ${diffs.length} diffs`);
          diffs.forEach(message => {
            this.dataService.updateWithDiff(message);
            this.messageBroker.publish(message)
          });
          this.previousData = newData;
        });
      })
      .catch(error => cb(error));  
    }, this.interval * 1000);
  }
}
