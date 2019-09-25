import jsonData from './data.json';
import {filterImages} from './correlation.js';

jsonData.forEach(workload => {
  if(workload.Containers) {
    workload.Containers.forEach(container => {
      filterImages(container, workload.Policies, (err, filtered) => {
        if(filtered) {
          filtered.forEach(image => console.log(image.ID));
        }
        // console.log(filtered.ID);
      });
    });  
  }
});
// const images = [
//   "dokken.azurecr.io/account-api:mock-2a3d272bba958d43a5a29a0107bbda139857feea",
//   "dokken.azurecr.io/account-api:ci-2a3d272bba958d43a5a29a0107bbda139857feea",
//   "dokken.azurecr.io/account-api:mock-ab576a97f2da09db7d6fed7db3346a1289b61e44",
//   "dokken.azurecr.io/account-api:ci-ab576a97f2da09db7d6fed7db3346a1289b61e44",
//   "dokken.azurecr.io/account-api:01fd27e",
// ];

// const tagRegex = new RegExp("^(?:([^\/]+)\/)?(?:([^\/]+)\/)?([^@:\/]+)(?:[@:](.+))?$", 'g');
// let imageTags = images.map(image => image.match(/^(?:([^\/]+)\/)?(?:([^\/]+)\/)?([^@:\/]+)(?:[@:](.+))?$/)[4]);
// let filtered = imageTags.filter(tag => tag.match(/^\w{7}(?:\w)?$/));
// console.log(filtered);

