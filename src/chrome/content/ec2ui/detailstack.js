var ec2_cloudFormationDetails = {
    init : function() {
        var CloudFormation = window.arguments[0];
        document.getElementById("ec2ui.CloudFormation.StackName").value = CloudFormation.StackName;
        document.getElementById("ec2ui.CloudFormation.StackId").value = CloudFormation.StackId;
        document.getElementById("ec2ui.CloudFormation.CreationTime").value = CloudFormation.CreationTime;
        document.getElementById("ec2ui.CloudFormation.Status").value = CloudFormation.Status;
    }
}