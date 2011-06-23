var ec2_InstanceConsole = {
    init : function() {
        document.getElementById("ec2ui.console.instanceid").value = window.arguments[0];
        document.getElementById("ec2ui.console.timestamp").value = window.arguments[1];

        var output = "<no output available>";
        if (window.arguments[2] != null) {
            output = window.arguments[2];
        }
        document.getElementById("ec2ui.console.output").value = output;

        try {
            var menulist = document.getElementById("ec2ui.console.encoding");
            var enc = ec2ui_utils.getMessageProperty("ec2ui.msg.instanceconsoledialog.encoding.valueslist");
            var valueslist = enc.split(",");
            for(var i in valueslist) {
                var encode = valueslist[i].trim();
                menulist.appendItem(encode, encode);
            }
            if (valueslist.length > 0) {
                menulist.selectedIndex = 1;
            }
        } catch (ex) {
            alert(ex);
        }

        this.encodingChanged();
    },

    encodingChanged : function() {
        var encode = document.getElementById("ec2ui.console.encoding").value;
        var output = document.getElementById("ec2ui.console.output").value;
        if (encode == "None") {
            document.getElementById("ec2ui.console.decoded_output").value = output;
        } else {
            try {
                var converter = Components.classes["@mozilla.org/intl/scriptableunicodeconverter"]
                                   .createInstance(Components.interfaces.nsIScriptableUnicodeConverter);
                converter.charset = encode;
                var decoded_output = converter.ConvertToUnicode(output);
                document.getElementById("ec2ui.console.decoded_output").value = decoded_output;
            } catch (ex) {
                alert(ex);
            }
        }
    }
}
