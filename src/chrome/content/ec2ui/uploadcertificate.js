var ec2_uploadCertificate = {
    ec2ui_session : null,
    retVal : null,
    
    launch : function() {
        this.retVal.ServerCertificateName = document.getElementById("ec2ui.uploadcretificate.ServerCertificateName").value.trim();
        this.retVal.CertificateBody = document.getElementById("ec2ui.uploadcretificate.CertificateBody").value.trim();
        this.retVal.PrivateKey = document.getElementById("ec2ui.uploadcretificate.PrivateKey").value.trim();
        this.retVal.Path = document.getElementById("ec2ui.uploadcretificate.Path").value.trim();
        this.retVal.ok = true;
        return true;
    },
    
    init : function() {
        this.ec2ui_session = window.arguments[0];
        this.retVal = window.arguments[1];
    }
};