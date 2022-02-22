const WebSocketPool = require("./websocket_pool.js");
const LogHelper = require('./log_helper.js');
var pools = null;
var ws_client = null;

function initWebsocketPool(){
    if(pools === null){
        pools = WebSocketPool.initWebsocketPool();
        LogHelper.time_log("INFO","test","initWebsocketPool","initWebsocketPool success! pools = " + pools);
        pools.poolStatus();
    }    
}

function acquireWebsocket(){
    pools.acquire('server1',function(client){
        ws_client = client;
        pools.status('server1');
        LogHelper.time_log("INFO","test","conn_websocket", 'ws_client_server1 acquire! url = ' + client.url
         + ', id = ' + client.id + ', useCount = ' + client.useCount);
        client.on('test',function(chunk){
            LogHelper.time_log("INFO","test","conn_websocket", "ws_client_server1 on test:" + chunk);
        });
    });
}

function releaseWebsocket(){
    pools.release('server1',ws_client);
    pools.status('server1');
    LogHelper.time_log("INFO","test","release_ws_client_server1", 'ws_client_server1 release! url = ' + ws_client.url 
    + ', id = ' + ws_client.id + ', useCount = ' + ws_client.useCount);
    ws_client.removeAllListeners();
    ws_client = null;
}

function test(){
    initWebsocketPool();
    setTimeout(function(){
        acquireWebsocket();
        // releaseWebsocket();
    },100)
}

test();
