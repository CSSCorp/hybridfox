var ec2_DhcpoptsCreator = {
    ec2ui_session : null,
    retVal : null,

    options : [["ec2ui.options.create_dhcp_options_dialog.0.label", "S", "ec2ui.options.create_dhcp_options_dialog.0.desc"],
               ["ec2ui.options.create_dhcp_options_dialog.1.label", "A", "ec2ui.options.create_dhcp_options_dialog.1.desc"],
               ["ec2ui.options.create_dhcp_options_dialog.2.label", "A", "ec2ui.options.create_dhcp_options_dialog.2.desc"],
               ["ec2ui.options.create_dhcp_options_dialog.3.label", "A", "ec2ui.options.create_dhcp_options_dialog.3.desc"],
               ["ec2ui.options.create_dhcp_options_dialog.4.label", "S", "ec2ui.options.create_dhcp_options_dialog.4.desc"]
              ],

    createDhcpOptions : function() {
        var opts = new Array();
        for(var i = 0; i < this.options.length; i++) {
            var optval = document.getElementById("ec2ui.newdhcpoptions.opt"+i).value;
            var finalval = new Array();

            if (optval != null && optval != "") {
                if (this.options[i][1] == "A") {
                    var parts = optval.split(','); 
                    for(var j = 0; j < parts.length; j++) {
                        finalval.push(parts[j].trim());
                    }
                } else {
                    finalval.push(optval);
                }
                
                opts.push([this.options[i][0], finalval]);
            }
        }

        this.retVal.opts = opts;
        this.retVal.ok = true;
        return true;
    },

    init : function() {
        this.ec2ui_session = window.arguments[0];
        this.retVal = window.arguments[1];

        for(var i = 0; i < this.options.length; i++) {
            var label = document.getElementById("ec2ui.newdhcpoptions.lab"+i);
            var desc = document.getElementById("ec2ui.newdhcpoptions.desc"+i);
            label.value = ec2ui_utils.getMessageProperty(this.options[i][0]);
            desc.value = ec2ui_utils.getMessageProperty(this.options[i][2]);
        }
    }
}
