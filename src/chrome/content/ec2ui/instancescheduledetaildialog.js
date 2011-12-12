var ec2_EventDetails = {
    init : function() {
        var instanceevent = window.arguments[0];
        document.getElementById("ec2ui.instanceevent.id").value = instanceevent.instanceId;
        document.getElementById("ec2ui.instanceevent.event").value = instanceevent.event;
        document.getElementById("ec2ui.instanceevent.description").value = instanceevent.description;
        document.getElementById("ec2ui.instanceevent.availabilityZone").value = instanceevent.availabilityZone;
        document.getElementById("ec2ui.instanceevent.startTime").value = instanceevent.startTime;
        document.getElementById("ec2ui.instanceevent.endTime").value = instanceevent.endTime;
    }
}
