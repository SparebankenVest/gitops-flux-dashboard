export default class EventStore {
  constructor(opt) {
    this.events = [];

    if(opt) {
      this.maxEvents = opt.maxEvents > 0 ? opt.maxEvents : 500;
    } 
  }
  
  write(event) {
    if(this.events.length >= this.maxEvents) {
      this.events.pop();
    }
    this.events.unshift(event);
  }
  
  json() {
    return this.events;
  }
}