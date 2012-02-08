var ec2_ServerCertificateDetails = {
    init : function() {
        var servercertificate = window.arguments[0];
        document.getElementById("ec2ui.servercert.servercertname").value = servercertificate.ServerCertificateName;
        document.getElementById("ec2ui.servercert.servercertid").value = servercertificate.ServerCertificateId;
        document.getElementById("ec2ui.servercert.arnid").value = servercertificate.Arn;
        document.getElementById("ec2ui.servercert.path").value = servercertificate.Path;
        document.getElementById("ec2ui.servercert.uploaddate").value = servercertificate.UploadDate;
    }
}