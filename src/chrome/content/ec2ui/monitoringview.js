var ec2ui_MonitoringTreeView = {

    selectedMetric : function(){
        var time = document.getElementById("monitoring.timerange").value;
        var instance = document.getElementById("ec2ui.monitoring.Instancelist").value;
	var statistics = document.getElementById("monitoring.statistics").value;
	var Metrics = document.getElementById("monitoring.Metrics").value;
        var EndTime = new Date();
	var ISOEndTime = EndTime.strftime('%Y-%m-%dT%H:%M:%SZ');

	if(time == "Last Hour"){
	    var StartTime = Date(EndTime.setHours(EndTime.getHours() - 1));
	    var period = 60;
	}else if(time == "Last 3 Hour"){
	    var StartTime = new Date(EndTime.setHours(EndTime.getHours() - 3));
	    var period = 60;
	}else if(time == "Last 6 Hour"){
	    var StartTime = new Date(EndTime.setHours(EndTime.getHours() - 6));
	    var period = 600;
	}else if(time == "Last 12 Hour"){
	    var StartTime = new Date(EndTime.setHours(EndTime.getHours() - 12));
	    var period = 600;
	}else if(time == "Last 24 Hour"){
	    var StartTime = new Date(EndTime.setHours(EndTime.getHours() - 24));
	    var period = 600;
	}else if(time == "Last week"){
	    var StartTime = new Date(EndTime.setDate(EndTime.getDate() - 7));
	    var period = 15000;
	}else if(time == "Last 2 week"){
	    var StartTime = new Date(EndTime.setDate(EndTime.getDate() - 14));
	    var period = 15000;
	}
	if(instance == ""){
	    var instance = null;
	}
        ec2ui_session.controller.GetMetricStatistics(StartTime, ISOEndTime, instance,statistics, period,Metrics);
	this.init();
    },
    
    instancelist : function(){
        var InstanceMenu = document.getElementById("ec2ui.monitoring.Instancelist");
        var Instance = ec2ui_session.model.getInstances();
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
        for (var i in Monitor) {
            var Timestamp = Monitor[i].Timestamp;
	    var Average = Monitor[i].Average;
            var data = {Time : Timestamp,Avg : Average};
            monitorarray.push(data);
        }
        var report = {x : "Time",y : "Avg",values : monitorarray};
        this.graph(report)
    },

    graph :function(report){
        var data = report.values;
        var canvas = document.getElementById("graph");
		
        var c = canvas.getContext("2d");
        var height = 500;
	var width = 960;
        var prevX = -1;
	var prevY = -1;
	for(var i =0; i< data.length; i++) {
	    var x = 60 + i*50;
	    var h = data[i][report.y]*3;
	    var w = 20;
	    var y = height-h - 20;
	
	    c.fillStyle="#0000FF";
	    c.beginPath();
	    c.arc(x,y,2,0,Math.PI*2,true);
	    c.closePath();
	    c.fill();
	    
	    if(prevX != -1 && prevY != -1)
	    {
		c.moveTo(prevX, prevY);
		c.lineTo(x,y);
		c.stroke();
	    }
	
	   prevX = x;
	   prevY = y;	
	}
	for(var i =0; i< data.length; i++) {
	    var x = 50 + i*50;
	    var h = data[i][report.y]*3;
	    var w = 20;
	    var y = height-h - 50;
	    c.fillStyle = "black";
	    c.font = 'italic 10pt sans-serif';
	    c.fillText(data[i][report.x],x-3,y+h+35);
	}
	//draw axis lines
	c.strokeStyle = "green";
	c.beginPath();
	c.moveTo(30.5,20.5);
	c.lineTo(30.5,height-30.5);
	c.lineTo(width-30.5,height-30.5);
	c.stroke();
	//draw ticks
	c.translate(0,-50.5);
	for(var i =0; i<=100; i+=10) {
	
	//tick line
	c.strokeStyle = "black";
	c.beginPath();
	c.moveTo(20.5,height-i*3);
	c.lineTo(30.5,height-i*3);
	c.stroke();
    
	//tick text
	c.fillStyle = "black";
	c.font = 'italic 10pt sans-serif';
	c.fillText(""+i,10,height-i*3-5);
	}
	c.translate(0,50.5);
    }

};
