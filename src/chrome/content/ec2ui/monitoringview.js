var ec2ui_MonitoringTreeView = {
    selectedMetric : function(){
        var time = document.getElementById("monitoring.timerange").value;
        var instance = document.getElementById("ec2ui.monitoring.Instancelist").value;
	//var statistics = document.getElementById("monitoring.statistics").value;
	var Metrics = document.getElementById("monitoring.Metrics").value;
	console.log(Metrics);
	if(Metrics == "CPUUtilization"){
	    Unit = "Percent";
	}else {
	    Unit = "Bytes";
	}
        var EndTime = new Date();
	var ISOEndTime = EndTime.strftime('%Y-%m-%dT%H:%M:%SZ');

	if(time == "Last Hour"){
	    var StartTime = new Date(EndTime.setHours(EndTime.getHours() - 1));
	    var period = 60;
	}else if(time == "Last 3 Hour"){
	    var StartTime = new Date(EndTime.setHours(EndTime.getHours() - 3));
	    var period = 60;
	}else if(time == "Last 6 Hour"){
	    var StartTime = new Date(EndTime.setHours(EndTime.getHours() - 6));
	    var period = 240;
	}else if(time == "Last 12 Hour"){
	    var StartTime = new Date(EndTime.setHours(EndTime.getHours() - 12));
	    var period = 2880;
	}else if(time == "Last 24 Hour"){
	    var StartTime = new Date(EndTime.setHours(EndTime.getHours() - 24));
	    var period = 5760;
	}else if(time == "Last week"){
	    var StartTime = new Date(EndTime.setDate(EndTime.getDate() - 7));
	    var period = 40320;
	}else if(time == "Last 2 week"){
	    var StartTime = new Date(EndTime.setDate(EndTime.getDate() - 14));
	    var period = 80640;
	}
	if(instance == ""){
	    var instance = null;
	}
	
        ec2ui_session.controller.GetMetricStatistics(StartTime, ISOEndTime, instance, period,Metrics,Unit);
	this.init();
    },
    
    instancelist : function(){
        var InstanceMenu = document.getElementById("ec2ui.monitoring.Instancelist");
        var Instance = ec2ui_session.model.getInstances();
	var count = InstanceMenu.itemCount;
	while(count-- > 0){
	    InstanceMenu.removeItemAt(0);
	}
        for (var i in Instance) {
	    InstanceMenu.appendItem(Instance[i].id , Instance[i].id);
        }
        InstanceMenu.selectedIndex = 0;
    },

    refresh: function() {
        this.instancelist();
	this.selectedMetric();
    },
    
    init : function(){
        var Monitor = ec2ui_session.model.getMonitoring();
        var monitorarray = new Array();
	var datearray = new Array();
        for (var i in Monitor) {
	    var newtime = Monitor[i].Timestamp;
	    datearray.push(newtime); 
        }
	
	datearray.sort();
	
	
	for (var idx in datearray) {
	    var temp = datearray[idx];
	    for (var i in Monitor) {
		var newtime = Monitor[i].Timestamp;
		if(temp == newtime){
		    var month = Monitor[i].Month+1;
		    var Timestamp = (Monitor[i].Date+"/"+month);
		    var Time = (Monitor[i].Hours+":"+Monitor[i].Minutes);
		    var Average = Monitor[i].Average;
		    var yvalue = Math.round(Average);
		    var data = {Dates : Timestamp,Avg : yvalue,Times : Time};
		    monitorarray.push(data);
		    break;
		}
	    }
	 }

        var report = {x : "Dates",y : "Avg",z : "Times",values : monitorarray};
        this.graph(report,850,420)
    },

    graph :function(report,  width, height){
        var data = report.values;
        var canvas = document.getElementById("graph");
        var xPadding = 50;
        var yPadding = 40;
        
	var largest = 0; 
	for(var i = 0; i < data.length; i ++) {
	    if(data[i][report.y] > largest) {
		 largest = data[i][report.y];
	    }
	}
	largest += 10 - largest % 10;
	
	
	function getXPixel(val) {
            return ((width - xPadding) / data.length) * val + (xPadding * 1.5);
        }
	
	function getYPixel(val) {
                return height - (((height - yPadding) / largest) * val) - yPadding;
        }
	
	var c = canvas.getContext("2d");
	
	function clearCanvas(c, canvas) {
	    c.clearRect(0, 0, canvas.width, canvas.height);
	    var w = canvas.width;
            canvas.width = 1;
            canvas.width = w;
        }
	
        c.clearRect(0,0,c.canvas.width,c.canvas.height);
	
	c.lineWidth = 1;
	c.strokeStyle = '#333';
	c.font = 'italic 8pt sans-serif';
	c.textAlign = "center";
	
	// Draw the axises
	c.font = '10px sans-serif';
	c.beginPath();
	c.moveTo(xPadding, 10);
	c.lineTo(xPadding, height - yPadding);
	c.lineTo(width, height - yPadding);
	c.stroke();
        
	// Draw the X value texts
	for(var i = 0; i < data.length; i ++) {
	    c.font = '10px sans-serif';
	    c.fillText(data[i][report.x], getXPixel(i), height - yPadding + 20);
	    c.fillText(data[i][report.z], getXPixel(i), height - yPadding + 35);
	}
	
	// Draw the Y value texts
	c.textAlign = "right"
	c.textBaseline = "middle";
	
	for(var i = 0; i < largest; i += largest/10) {
	    c.font = '10px sans-serif';
	    c.fillText(i, xPadding - 10, getYPixel(i));
	}
	
	c.strokeStyle = '#f00';
	
	// Draw the line graph
	c.beginPath();
	c.moveTo(getXPixel(0), getYPixel(data[0][report.y]));
	for(var i = 1; i < data.length; i ++) {
	    c.font = '10px sans-serif';
	    c.lineTo(getXPixel(i), getYPixel(data[i][report.y]));
	}
	c.stroke();
	
	// Draw the dots
	c.fillStyle = '#333';
	
	for(var i = 0; i < data.length; i ++) {  
	    c.beginPath();
	    c.font = '10px sans-serif';
	    c.arc(getXPixel(i), getYPixel(data[i][report.y]), 2, 0, Math.PI * 2, true);
	    c.fill();
	}
    }

};
