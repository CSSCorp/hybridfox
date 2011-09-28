var ec2_StackResourceDetails = {
    init : function() {
        var Describeresource = window.arguments[0];
        document.getElementById("ec2ui.stackresource.Timestamp").value = Describeresource.Timestamp;
        document.getElementById("ec2ui.stackresource.ResourceStatus").value = Describeresource.ResourceStatus;
        document.getElementById("ec2ui.stackresource.StackId").value = Describeresource.StackId;
        document.getElementById("ec2ui.stackresource.LogicalResourceId").value = Describeresource.LogicalResourceId;
        document.getElementById("ec2ui.stackresource.PhysicalResourceId").value = Describeresource.PhysicalResourceId;
        document.getElementById("ec2ui.stackresource.ResourceType").value = Describeresource.ResourceType;
    }
}