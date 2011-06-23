var ec2_CreateImageDialog = {
    id : null,
    ec2ui_session : null,
    retVal : null,

    getAmiName : function() {
        return document.getElementById("ec2ui.createImage.amiName");
    },

    getAmiDescription : function() {
        return document.getElementById("ec2ui.createImage.amiDescription");
    },

    getNoReboot : function() {
        return document.getElementById("ec2ui.createImage.noReboot");
    },

    createImage : function() {
        this.retVal.amiName = this.getAmiName().value;
        this.retVal.amiDescription = this.getAmiDescription().value;

        var regex = new RegExp("^[0-9a-zA-Z\_\(\)\,\/\-]{3,128}$");
        if (!this.retVal.amiName.match(regex)) {
            alert (ec2ui_utils.getMessageProperty("ec2ui.msg.createImageDialog.alert.createImage"));
            return false;
        }

        if (this.getNoReboot().checked) {
            this.retVal.noReboot = true;
        } else {
            this.retVal.noReboot = false;
        }

        this.retVal.ok = true;
        return true;
    },

    init : function() {
        this.id = window.arguments[0];
        this.ec2ui_session = window.arguments[1];
        this.retVal = window.arguments[2];

        document.getElementById("ec2ui.createImage.instanceid").value = this.id;
        this.getAmiName().select();
    }
}
