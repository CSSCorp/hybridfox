var ec2ui_MonitoringTreeView = {
    
    selectedMetric : function(){
	var time = document.getElementById("monitoring.timerange").value;
	var instance = document.getElementById("ec2ui.monitoring.Instancelist").value;
	var statistics = document.getElementById("monitoring.statistics").value;
	var Metrics = document.getElementById("monitoring.Metrics").value;
	var Period = document.getElementById("monitoring.period").value;
	
	//for Mertics
	if(Metrics == "CPUUtilization"){
	    Unit = "Percent";
	}else {
	    Unit = "Bytes";  
	}
	
	//for period
	if(Period == "1 Minute"){
	    var period = 60;	    
	}else if(Period == "5 Minutes"){
	    var period = 300;
	}else if(Period == "15 Minutes"){
	    var period = 900;
	}else if(Period == "1 Hour"){
	    var period = 3600;
	}
	
	//for Timerange
	var EndTime = new Date();
	var ISOEndTime = this.ISODateString(EndTime);

	if(time == "Last Hour"){
	    var StartTime = new Date(EndTime.setHours(EndTime.getHours() - 1));
	}else if(time == "Last 3 Hour"){
	    var StartTime = new Date(EndTime.setHours(EndTime.getHours() - 3));
	}else if(time == "Last 6 Hour"){
	    var StartTime = new Date(EndTime.setHours(EndTime.getHours() - 6));
	}else if(time == "Last 12 Hour"){
	    var StartTime = new Date(EndTime.setHours(EndTime.getHours() - 12));
	}else if(time == "Last 24 Hour"){
	    var StartTime = new Date(EndTime.setHours(EndTime.getHours() - 24));
	}else if(time == "Last week"){
	    var StartTime = new Date(EndTime.setDate(EndTime.getDate() - 7));
	}else if(time == "Last 2 week"){
	    var StartTime = new Date(EndTime.setDate(EndTime.getDate() - 14));
	}
	if(instance == ""){
	    var instance = null;
	}
	var GMTStartTime = this.ISODateString(StartTime);

	ec2ui_session.controller.GetMetricStatistics(GMTStartTime, ISOEndTime, instance,statistics, period,Metrics,Unit);
	this.init();
	this.RefreshTimer();
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
		    var Sum = Monitor[i].Sum;
		    var Maximum = Monitor[i].Maximum;
		    var Minimum = Monitor[i].Minimum;
		    var yvalue = Math.round(Average);
		    var yvalue1 = Math.round(Sum);
		    var yvalue2 = Math.round(Maximum);
		    var yvalue3 = Math.round(Minimum);
		    if(Average != "null"){
			var data = {Dates : Timestamp,Avg : yvalue,Times : Time};
		    }else if(Sum != "null"){
			var data = {Dates : Timestamp,Avg : yvalue1,Times : Time};
		    }else if(Maximum != "null"){
			var data = {Dates : Timestamp,Avg : yvalue2,Times : Time};
		    }else if(Minimum != "null"){
			var data = {Dates : Timestamp,Avg : yvalue3,Times : Time};
		    }
		    monitorarray.push(data);
		    break;
		}
	    }
	 }
        var report = {x : "Dates",y : "Avg",z : "Times",values : monitorarray};
	var time = document.getElementById("monitoring.timerange").value;
	var Period = document.getElementById("monitoring.period").value;
	
	if(time == "Last Hour"){
		if(Period == "1 Minute"){
		    var interval = 5;	    
		}else if(Period == "5 Minutes"){
		    var interval = 1;
		}else if(Period == "15 Minutes"){
		    var interval = 1;
		}else if(Period == "1 Hour"){
		    var interval = 1;
		}
	}else if(time == "Last 3 Hour"){
		if(Period == "1 Minute"){
		    var interval = 15;	    
		}else if(Period == "5 Minutes"){
		    var interval = 3;
		}else if(Period == "15 Minutes"){
		    var interval = 1;
		}else if(Period == "1 Hour"){
		    var interval = 1;
		}
	}else if(time == "Last 6 Hour"){
		if(Period == "1 Minute"){
		    var interval = 30;	    
		}else if(Period == "5 Minutes"){
		    var interval = 6;
		}else if(Period == "15 Minutes"){
		    var interval = 2;
		}else if(Period == "1 Hour"){
		    var interval = 1;
		}
	}else if(time == "Last 12 Hour"){
		if(Period == "1 Minute"){
		    var interval = 60;	    
		}else if(Period == "5 Minutes"){
		    var interval = 12;
		}else if(Period == "15 Minutes"){
		    var interval = 4;
		}else if(Period == "1 Hour"){
		    var interval = 1;
		}
	}else if(time == "Last 24 Hour"){
		if(Period == "1 Minute"){
		    var interval = 120;	    
		}else if(Period == "5 Minutes"){
		    var interval = 24;
		}else if(Period == "15 Minutes"){
		    var interval = 8;
		}else if(Period == "1 Hour"){
		    var interval = 2;
		}
	}else if(time == "Last week"){
		if(Period == "1 Minute"){
		    var interval = 840;	    
		}else if(Period == "5 Minutes"){
		    var interval = 168;
		}else if(Period == "15 Minutes"){
		    var interval = 56;
		}else if(Period == "1 Hour"){
		    var interval = 14;
		}
	}else if(time == "Last 2 week"){
		if(Period == "1 Minute"){
		    var interval = 2*840;	    
		}else if(Period == "5 Minutes"){
		    var interval = 2*168;
		}else if(Period == "15 Minutes"){
		    var interval = 112;
		}else if(Period == "1 Hour"){
		    var interval = 28;
		}
	}
        this.graph(report, 850, 430, interval)
    },

    graph : function(report, width, height, interval){
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
            return ((width - xPadding) / data.length) * val + (xPadding * 1.0);
        }
	
	function getYPixel(val) {
	    return height - ((height - 60) / largest) * val - (60 * 0.75);
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
	for(var i = 0; i < data.length; i+=interval) {
	    c.font = '10px sans-serif';
	    c.fillText(data[i][report.x], getXPixel(i), height - yPadding + 20);
	    c.fillText(data[i][report.z], getXPixel(i), height - yPadding + 35);
	    c.beginPath();
	    c.font = '10px sans-serif';
	    c.arc(getXPixel(i), getYPixel(data[i][report.y]), 2, 0, Math.PI * 2, true);
	    c.fill();
	}
	
	// Draw the Y value texts
	c.textAlign = "right"
	c.textBaseline = "middle";
	var largetry = largest + (10 - (largest % 10));

	for(var i = 0; i <= largetry; i += largest/10) {
	    c.font = '10px sans-serif';
	    if(largest >= i){
		c.fillText(i, xPadding - 5, getYPixel(i));
	    }
	}
	
	c.strokeStyle = '#4169E1';
	
	// Draw the line graph
	c.beginPath();
	c.moveTo(getXPixel(0), getYPixel(data[0][report.y]));
	for(var i = 1; i < data.length; i ++) {
	    c.font = '10px sans-serif';
	    c.lineTo(getXPixel(i), getYPixel(data[i][report.y]));
	}
	c.stroke();
	
    },
    
    RefreshTimer : function() {
	var me = this;
	setInterval(function() { me.selectedMetric(); }, 1*60*1000);
    },

    
    ISODateString : function(d){
	function pad(n){return n<10 ? '0'+n : n}
	    return d.getUTCFullYear()+'-'
	    + pad(d.getUTCMonth()+1)+'-'
	    + pad(d.getUTCDate())+'T'
	    + pad(d.getUTCHours())+':'
	    + pad(d.getUTCMinutes())+':'
	    + pad(d.getUTCSeconds())+'Z'
    }


};
