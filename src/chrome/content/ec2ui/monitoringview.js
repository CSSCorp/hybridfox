var ec2ui_MonitoringTreeView = {

    selectedMetric : function(){
        var time = document.getElementById("monitoring.timerange").value;
        var instance = document.getElementById("ec2ui.monitoring.Instancelist").value;
	var statistics = document.getElementById("monitoring.statistics").value;
	var Metrics = document.getElementById("monitoring.Metrics").value;
        var EndTime = new Date();
	var ISOEndTime = EndTime.strftime('%Y-%m-%dT%H:%M:%SZ');

	if(time == "Last Hour"){
	    var StartTime = new Date(EndTime.setHours(EndTime.getHours() - 1));
	    var period = 240;
	}else if(time == "Last 3 Hour"){
	    var StartTime = new Date(EndTime.setHours(EndTime.getHours() - 3));
	    var period = 720;
	}else if(time == "Last 6 Hour"){
	    var StartTime = new Date(EndTime.setHours(EndTime.getHours() - 6));
	    var period = 1440;
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
	    var newtime = Monitor[i].Timestamp;
	    var Timestamp = (Monitor[i].Date+"/"+Monitor[i].Month);
	    var Time = (Monitor[i].Hours+":"+Monitor[i].Minutes);
	    var Average = Monitor[i].Average;
            var data = {Dates : Timestamp,Avg : Average,Times : Time};
            monitorarray.push(data);
        }
        var report = {x : "Dates",y : "Avg",z : "Times",values : monitorarray};
        this.graph(report,850,400)
    },

    graph :function(report,  width, height){
        var data = report.values;
        var canvas = document.getElementById("graph");

        var prevX = -1;
	var prevY = -1;
	
	var c = canvas.getContext("2d");
	
	function clearCanvas(c, canvas) {
	     c.clearRect(0, 0, canvas.width, canvas.height);
	     var w = canvas.width;
             canvas.width = 1;
             canvas.width = w;
        }
	
        c.clearRect(0,0,c.canvas.width,c.canvas.height);

	for(var i =0; i< data.length; i++) {
	    var x = 60 + i*50;
	    var h = data[i][report.y]*3;
	    var w = 20;
	    var y = height-h - 20;
	
	    c.fillStyle="#0000FF";
	    c.beginPath();
	    c.arc(x,y,2,0,Math.PI*2,true);
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
	    var finaldata = Math.round(data[i][report.y]*Math.pow(10,2))/Math.pow(10,2);
	    var w = 20;
	    var y = height-h - 60;
	    c.fillStyle = "black";
	    c.font = '9pt sans-serif';
	    c.fillText(data[i][report.x],x-3,y+h+45);
	    c.fillText(data[i][report.z],x-3,y+h+60);
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
	 
	  c.strokeStyle = "green";
	  c.beginPath();
	  c.moveTo(20.5,height-i*3);
	  c.lineTo(30.5,height-i*3);
	  c.stroke();    
	    
    	//tick text
	c.fillStyle = "black";
	c.font = '9pt sans-serif';
	c.fillText(""+i,5,height-i*3-5);
	}
	c.translate(0,50.5);
    }

};
