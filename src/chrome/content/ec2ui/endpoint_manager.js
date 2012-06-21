var ec2ui_endpointManager = {
    endpointmap : null,

    initDialog : function() {
        this.endpointmap = window.arguments[0];

        document.getElementById("ec2ui.endpoints.view").view = ec2ui_endpointsTreeView;
        ec2ui_endpointsTreeView.setMapping(this.endpointmap);

        var lastEndpointName = ec2ui_prefs.getLastUsedEndpoint();
        if (lastEndpointName != null) {
            var index = this.indexOfEndpointName(lastEndpointName);
            ec2ui_endpointsTreeView.selectEndpointName(index);
        }
    },

    indexOfEndpointName : function(name) {
        var endpointlist = this.endpointmap.toArray(function(k,v){return v});

        for (var i = 0; i < endpointlist.length; i++) {
            if (endpointlist[i].name == name) {
                return i;
            }
        }
        return -1;
    },

    removeEndpoint : function() {
        var name = document.getElementById("ec2ui.endpoints.name").value;
        if (name == null || name == "") return;

        this.endpointmap.removeKey(name);
        ec2ui_endpointsTreeView.setMapping(this.endpointmap);
    },

    saveEndpoint : function() {
        var name = document.getElementById("ec2ui.endpoints.name").value.trim() || "";
        var type = document.getElementById("ec2ui.endpoints.type").selectedItem.value;
        var url = document.getElementById("ec2ui.endpoints.url").value.trim() || "";
        if (name.length == 0) return;
        if (type.length == 0) return;
        if (url.length == 0) return;

        this.endpointmap.put(name, new Endpoint(name, type, url));
        ec2ui_endpointsTreeView.setMapping(this.endpointmap);
    },

    selectMapping : function() {
        var sel = ec2ui_endpointsTreeView.getSelectedEndPoint();
        if (sel != null) {
            document.getElementById("ec2ui.endpoints.name").value = sel.name;
		if (sel.type == ("ec2")) {
            	    document.getElementById("ec2ui.endpoints.type").selectedIndex = 0;
		}
		else if(sel.type == ("euca")){
            	    document.getElementById("ec2ui.endpoints.type").selectedIndex = 1;
		}
                else if(sel.type == ("nova")){
            	    document.getElementById("ec2ui.endpoints.type").selectedIndex = 2;
                }
                else if(sel.type == ("nebula")){
                    document.getElementById("ec2ui.endpoints.type").selectedIndex = 3;
                }
		else if(sel.type == ("cloudstack")){
                    document.getElementById("ec2ui.endpoints.type").selectedIndex = 4;
                }
            document.getElementById("ec2ui.endpoints.url").value = sel.url;
        }
    }
}
