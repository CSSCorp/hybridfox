var ec2_SnapshotDetails = {
    init : function() {
        var snapshot = window.arguments[0];
        document.getElementById("ec2ui.snapshot.id").value = snapshot.id;
        document.getElementById("ec2ui.snapshot.volumeId").value = snapshot.volumeId;
        document.getElementById("ec2ui.snapshot.status").value = snapshot.status;
        document.getElementById("ec2ui.snapshot.startTime").value = snapshot.startTime;
        document.getElementById("ec2ui.snapshot.progress").value = snapshot.progress;
        document.getElementById("ec2ui.snapshot.tag").value = snapshot.tag || "";
    }
}
