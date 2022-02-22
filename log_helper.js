var os = require('os');
var logDebug = 0;

function LogHelper(){
};


module.exports = LogHelper;

function getIPAdress() {
    var interfaces = os.networkInterfaces();
    for (var devName in interfaces) {
        var iface = interfaces[devName];
        for (var i = 0; i < iface.length; i++) {
            var alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                return alias.address;
            }
        }
    }
}

LogHelper.time_log = function(level,classname,funcname,parameter){
	
	var dateObj=new Date();
	var hour_minutes_sec_time = dateObj.getFullYear() + "-" + (dateObj.getMonth() + 1) + "-" + dateObj.getDate() + " " + dateObj.getHours() + ":" + dateObj.getMinutes() + ":" + dateObj.getSeconds() + "." + dateObj.getMilliseconds();
	var host = getIPAdress();
	if(level != "DEBUG")
	{
		console.log(hour_minutes_sec_time + " |  " + level + " | | " + host + " | | | " + classname + "." + funcname + " | " + parameter + "\n");
	}
	else 
	{
		if(logDebug == 1)
		{
			console.log(hour_minutes_sec_time + " | " + level + " | | " + host + " | | | " + classname + "." + funcname + " | " + parameter + "\n");
		}
	}
}
