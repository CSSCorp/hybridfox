var ec2_SpotInstanceDetails = {
    init : function() {
        var session = window.arguments[0];
        var spotinstance = window.arguments[1];

        document.getElementById("ec2ui.spotinstance.requestid").value = spotinstance.requestId;
        document.getElementById("ec2ui.spotinstance.instanceid").value = spotinstance.instanceId;
        document.getElementById("ec2ui.spotinstance.spotprice").value = spotinstance.spotPrice;
        document.getElementById("ec2ui.spotinstance.state").value = spotinstance.state;
        document.getElementById("ec2ui.spotinstance.sptype").value = spotinstance.type;
        document.getElementById("ec2ui.spotinstance.type").value = spotinstance.instanceType;
        document.getElementById("ec2ui.spotinstance.imageid").value = spotinstance.imageId;
        document.getElementById("ec2ui.spotinstance.key").value = spotinstance.keyName;
        document.getElementById("ec2ui.spotinstance.creation").value = spotinstance.createTime;
        document.getElementById("ec2ui.spotinstance.product").value = spotinstance.productDescription;
        document.getElementById("ec2ui.spotinstance.zone").value = spotinstance.launchedAvailabilityZone;
        
    }
};