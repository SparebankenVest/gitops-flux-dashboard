import crypto from 'crypto';

export function createHash(jsonData) {
  return crypto.createHash('sha256')
    .update(JSON.stringify(jsonData), 'utf8')
    .digest('hex');
}

export function differ(newData, oldData) {
  if(isObject(newData) && isObject(oldData)) {
    let newHash = createHash(newData);
    let oldHash = createHash(oldData);
    return newHash !== oldHash;
  }
  else if(isObject(newData) || isObject(oldData)) {
    return true;
  }
  else {
    return newData !== oldData;
  }
}

function isObject (value) {
  return value && typeof value === 'object' && value.constructor === Object;
}