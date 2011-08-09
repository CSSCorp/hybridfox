var ec2ui_MonitoringTreeView = {

    test : function(){
        var selecteditem = document.getElementById("monitoring.timerange").value;
        if(selecteditem == "Last 6 Hour"){
           var starttime = "2011-07-14T02:15:18.000Z";
           var endtime  = "2011-07-14T16:15:18.000Z"
           var instance = null;
           ec2ui_session.controller.GetMetricStatistics(starttime,endtime,instance); 
        }
    },
    
    selectedMetric : function(){
        var time = document.getElementById("monitoring.timerange").value;
        var instance = document.getElementById("ec2ui.monitoring.Instancelist").value;
        if(time == "Last 6 Hour"){
           var starttime = "2011-07-14T02:15:18.000Z";
           var endtime  = "2011-07-14T16:15:18.000Z";
        }else{
           var starttime = null;
           var endtime = null;
        }
        if(instance == ""){
            var instance = null;
        }
        ec2ui_session.controller.GetMetricStatistics(starttime,endtime,instance);
    },
    
    selectedinstance : function(){
        var instance = document.getElementById("ec2ui.monitoring.Instancelist").value;
        var starttime = null;
        var endtime = null;
        if(instance != ""){
            ec2ui_session.controller.GetMetricStatistics(starttime,endtime,instance); 
        }
	this.init();
    },
   
    instancelist : function(){
        var InstanceMenu = document.getElementById("ec2ui.monitoring.Instancelist");
        InstanceMenu.appendItem("Select an Instance", null);
        var Instance = ec2ui_session.model.getInstances();
        for (var i in Instance) {
            InstanceMenu.appendItem(Instance[i].id , Instance[i].id);
        }
        InstanceMenu.selectedIndex = 0;
    },

    refresh: function() {
        this.instancelist();
        this.init();
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
        var height = 320;
	var width = 320;
        var prevX = -1;
	var prevY = -1;
	for(var i =0; i< 6; i++) {
	    var x = 60 + i*50;
	    var h = data[i][report.y]*3;
	    var w = 20;
	    var y = height-h - 20;
	//    c.fillStyle = "red";
	//    c.fillRect(x,y,w,h);
	
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
	for(var i =0; i< 6; i++) {
	    var x = 60 + i*50;
	    var h = data[i][report.y]*3;
	    var w = 20;
	    var y = height-h - 20;
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
	    c.strokeStyle = "green";
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

