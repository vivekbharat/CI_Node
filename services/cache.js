const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');
const keys = require('../config/keys');


//const redisUrl = 'redis://127.0.0.1:6379';
const client = redis.createClient(keys.redisUrl);
client.hget = util.promisify(client.hget);


const exec = mongoose.Query.prototype.exec;

mongoose.Query.prototype.cache = function(options = {}) {
  this.useCache = true;
  this.hashKey = JSON.stringify(options.key || '');
  return this;
}

mongoose.Query.prototype.exec = async function() {
    // console.log('Im about to run a Query');
    // console.log(this.getQuery());
    // console.log(this.mongooseCollection.name)
    if(!this.useCache) {
      return exec.apply(this, arguments);
    }
    const key = JSON.stringify(Object.assign({}, this.getQuery(), {
      collection: this.mongooseCollection.name
    }));

    //See if we have a value for key in redisUrl
    const cacheValue = await client.hget(this.hashKey, key);
    //If we do return that
    if(cacheValue){
      // const doc = new this.model(JSON.parse(cacheValue));
      const doc = JSON.parse(cacheValue);
      // return doc;
      return Array.isArray(doc)
        ? doc.map(d => new this.model(d))//Its an array
        : new this.model(doc);//its an object;
    }
    //Otherwise, issue the query and store the result in redis
    const result = await exec.apply(this, arguments);
    client.hset(this.hashKey, key, JSON.stringify(result), 'EX', 10);
    return result;

    // console.log(key);
};

module.exports = {
  clearHash(hashKey){
    client.del(JSON.stringify(hashKey));
  }
}
