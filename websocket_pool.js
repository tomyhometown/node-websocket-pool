const genericPool = require('generic-pool');
const io = require("socket.io-client");
const LogHelper = require('./log_helper.js');
var conf = require("./server_config.json");

/**
 * Step 1 - Create pool using a factory object
 */

function createWebsocketPool(name, host, port, max, min, maxUses, idleTimeoutMillis){

    const websocketPool = {
        create: function() {
            var url = 'http://' + host + ':' + port;
            var client = io(url,{'force new connection': true});
            client.useCount = 0;
            client.url = url;
            LogHelper.time_log("INFO","websocket_poll","createWebsocketPool", 'websocket connect! name = ' + name +  ', url = ' + client.url + ', useCount = ' + client.useCount);
            client.on('connect',function(){
                LogHelper.time_log("INFO","websocket_poll","createWebsocketPool", 'websocket connected! name = ' + name +  ', client.id = ' + client.id);
            });
            client.on('disconnect',function(reason){ 
                LogHelper.time_log("INFO","websocket_poll","createWebsocketPool", 'websocket disconnect! name = ' + name +  ', reason = ' + reason);
            });
            return client;
        },
        destroy: function(client) {
            client.disconnect();
        }
    };

    const opts = {
        max: max, // maximum size of the pool
        min: min, // minimum size of the pool
        maxUses : maxUses, // 每一个 实例 最大可重用次数，超过后将重启实例。0表示不检验
        idleTimeoutMillis : idleTimeoutMillis // 如果一个实例 60分钟 都没访问就关掉他
    };

    var pool = genericPool.createPool(websocketPool, opts);
    pool.name = name;
    return pool;
}

class WebsocketPool {
    constructor() {
        this.pools = [];
        this.init = function () {
            for (var i = 0; i < conf.websocket.length; i++) {
                var websocket = conf.websocket[i];
                var pool_name = websocket.name;
                LogHelper.time_log("INFO", "websocket_poll", "WebsocketPool", 'createWebsocketPool!');
                this.pools[pool_name] = createWebsocketPool(websocket.name, websocket.host, websocket.port, websocket.max, websocket.min, websocket.maxUses, websocket.idleTimeoutMillis);
            }
        };
        this.init();
    }

    acquire(name, callback){
        LogHelper.time_log("INFO","websocket_poll","acquire",'acquire a client! name = ' + name);
        // acquire connection - Promise is resolved
        // once a resource becomes available
        const resourcePromise = this.pools[name].acquire();
    
        resourcePromise
        .then(function(client) {
            client.useCount++;
            callback(client);
        })
        .catch(function(err) {
            // handle error - this is generally a timeout or maxWaitingClients
            LogHelper.time_log("ERROR","websocket_poll","acquire",'acquire catch error! name = ' + name + ', error = ' + err);
        });
    }
    
    release(name, client){
        LogHelper.time_log("INFO","websocket_poll","release",'release a client! name = ' + name);
        this.pools[name].release(client);
    }
    
    poolStatus(){
        for(var i=0;i < conf.websocket.length;i++){
            var websocket = conf.websocket[i];
            var name = websocket.name;
            LogHelper.time_log("INFO","websocket_poll","poolStatus", 'pool.name = ' + this.pools[name].name + ', pool.max = ' + this.pools[name].max + ', pool.min = ' + this.pools[name].min
            + ', pool.size = ' + this.pools[name].size + ', pool.available = ' + this.pools[name].available + ', pool.borrowed = ' + this.pools[name].borrowed + ', pool.pending = ' + this.pools[name].pending);
        }
    }
    
    status(name){
        LogHelper.time_log("INFO","websocket_poll","status", 'pool.name = ' + this.pools[name].name + ', pool.max = ' + this.pools[name].max + ', pool.min = ' + this.pools[name].min
        + ', pool.size = ' + this.pools[name].size + ', pool.available = ' + this.pools[name].available + ', pool.borrowed = ' + this.pools[name].borrowed + ', pool.pending = ' + this.pools[name].pending);
    }
    
    drain(name){
        this.pools[name].drain().then(function() {
            this.pools[name].clear();
        });
    }
}

module.exports = {
    WebsocketPool:WebsocketPool,
    initWebsocketPool:function(){
        LogHelper.time_log("INFO","websocket_poll","initWebsocketPool", 'new websocketPool!');
        return new WebsocketPool();
    }
}
