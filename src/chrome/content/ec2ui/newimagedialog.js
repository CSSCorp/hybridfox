var ec2_ImageRegistrar = {
    ec2ui_session : null,
    retVal : null,

    getTextBox : function() {
        return document.getElementById("ec2ui.newimage.manifest");
    },

    registerImage : function() {
        if (!this.validateManifest()) return false;
        this.retVal.manifestPath = this.getTextBox().value;
        this.retVal.ok = true;
        return true;
    },

    validateManifest : function() {
        var textbox = this.getTextBox();
        var value = textbox.value;
        if (value == "") {
            alert(ec2ui_utils.getMessageProperty("ec2ui.msg.newimagedialog.alert.validateManifest.1"));
            textbox.select();
            return false;
        }
        var oldextre = new RegExp("\\.manifest$");
        var newextre = new RegExp("\\.manifest\\.xml$");
        if (value.match(oldextre) == null &&
            value.match(newextre) == null) {
            alert(ec2ui_utils.getMessageProperty("ec2ui.msg.newimagedialog.alert.validateManifest.2"));
            textbox.select();
            return false;
        }
        if (this.ec2ui_session.isAmazonEndpointSelected()) {
            var s3bucket = value.split('/')[0];
            if (s3bucket.match(new RegExp("[A-Z]"))) {
                alert(ec2ui_utils.getMessageProperty("ec2ui.msg.newimagedialog.alert.validateManifest.3"));
                textbox.select();
                return false;
            }
        }
        var httppre = new RegExp("^http", "i");
        if (value.match(httppre) != null) {
            alert(ec2ui_utils.getMessageProperty("ec2ui.msg.newimagedialog.alert.validateManifest.4"));
            textbox.select();
            return false;
        }
        return true;
    },

    init : function() {
        this.ec2ui_session = window.arguments[0];
        this.retVal = window.arguments[1];
    }
}
