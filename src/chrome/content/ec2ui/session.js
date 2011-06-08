//main object that holds the current session information
var ec2ui_session =
{
    accessCode      : "",
    secretKey       : "",
    initialized     : false,
    controller      : null,
    model           : null,
    credentials     : null,
    accountidmap    : null,
    endpointmap     : null,
    instanceTags    : null,
    volumeTags      : null,
    snapshotTags    : null,
    imageTags       : null,
    eipTags         : null,
    client          : null,
    refreshedTabs   : new Array(),

    initialize : function () {
        if (!this.initialized) {
            this.controller = ec2ui_controller;
            this.model = ec2ui_model;
            this.client = ec2_httpclient;
            ec2ui_prefs.init();
            this.preferences = ec2ui_prefs;

            document.getElementById("ec2ui.images.view").view = ec2ui_AMIsTreeView;
            document.getElementById("ec2ui.keypairs.view").view = ec2ui_KeypairTreeView;
            document.getElementById("ec2ui.instances.view").view = ec2ui_InstancesTreeView;
            document.getElementById("ec2ui.securitygroups.view").view = ec2ui_SecurityGroupsTreeView;
            document.getElementById("ec2ui.permissions.view").view = ec2ui_PermissionsTreeView;
            document.getElementById("ec2ui.eip.view").view = ec2ui_ElasticIPTreeView;
            document.getElementById("ec2ui.azones.view").view = ec2ui_AvailZoneTreeView;
            document.getElementById("ec2ui.volumes.view").view = ec2ui_VolumeTreeView;
            document.getElementById("ec2ui.snapshots.view").view = ec2ui_SnapshotTreeView;
            document.getElementById("ec2ui.bundleTasks.view").view = ec2ui_BundleTasksTreeView;
            document.getElementById("ec2ui.offerings.view").view = ec2ui_LeaseOfferingsTreeView;
            document.getElementById("ec2ui.rsvdInst.view").view = ec2ui_ReservedInstancesTreeView;

            // Enable about:blank to work if noscript is installed
            if("@maone.net/noscript-service;1" in Components.classes) {
                (Components.classes ["@maone.net/noscript-service;1"].getService().wrappedJSObject).setJSEnabled("about:blank", true);
            }

            this.loadAccountIdMap();
            this.loadCredentials();
            this.switchCredentials();
            this.loadAllTags();

            this.initialized = true;
        }

        this.loadEndpointMap();
        this.switchEndpoints();
        this.args = this.parseURL();
        this.processURLArguments();
    },

    parseURL : function () {
        var a = window.location.href.split("?");
        if (a[1]) a = a[1].split("&");
        var o = {};
        for (var i = 0; i < a.length; ++i) {
            var parts = a[i].split("=");
            o[parts[0]] = parts[1];
        }
        return o;
    },

    processURLArguments : function () {
        // At this moment, we only act on the ami argument
        var fSync = false;
        var amiToLaunch = this.args.ami;
        var tabBox = document.getElementById("ec2ui.primary.tabs");
        if (amiToLaunch &&
            amiToLaunch.match(regExs["ami"])) {
            fSync = true;
            if (tabBox.selectedIndex != 1) {
                tabBox.selectedIndex = 1;
            }
        }
        this.showBusyCursor(true);
        if (fSync) {
            // this is a synchronous call, meaning
            // an ami launch was requested
            ec2ui_AMIsTreeView.selectByImageId(amiToLaunch);
            this.showBusyCursor(false);
            ec2ui_AMIsTreeView.launchNewInstances();
        } else {
            // Since this is an async call, and the UI has
            // not switched over to the Images Tab,
            if (tabBox.selectedIndex != 1) {
                this.controller.describeImages(fSync);
            }
            this.showBusyCursor(false);
        }
    },

    addTabToRefreshList : function (tab) {
        log("Called by: " + tab + " to start refreshing");
        if (tab != null) {
            this.refreshedTabs[tab] = 1;
        }
    },

    removeTabFromRefreshList : function (tab) {
        log("Called by: " + tab + " to stop refreshing");
        if (tab != null) {
            this.refreshedTabs[tab] = 0;
        }
    },

    tabSelectionChanged : function (event) {
        if (!this.initialized) { return; }
        var tabs = document.getElementById("ec2ui.tabs");

        var toCall = "invalidate()";
        if (this.getActiveCredential() != null &&
            ec2ui_prefs.isRefreshOnChangeEnabled()) {
            toCall = "refresh()";
        }

        // stop the refresh timers of all tabs
        for (var tab in this.refreshedTabs) {
            if (this.refreshedTabs[tab] == 1) {
                this.refreshedTabs[tab] = 0;
                log("Stopping Refresh of tab: " + tab);
                eval(tab + ".stopRefreshTimer()");
            }
        }
        
        switch (tabs.selectedItem.id) {
        case 'ec2ui.tabs.instances':
            eval("ec2ui_InstancesTreeView." + toCall);
            break;
        case 'ec2ui.tabs.images':
            this.showBusyCursor(true);
            this.model.getSecurityGroups();
            this.model.getImages();
            this.showBusyCursor(false);
            break;
        case "ec2ui.tabs.keypairs":
            eval("ec2ui_KeypairTreeView." + toCall);
            break;
        case "ec2ui.tabs.secgroups":
            eval("ec2ui_SecurityGroupsTreeView." + toCall);
            break;
        case "ec2ui.tabs.eips":
            eval("ec2ui_ElasticIPTreeView." + toCall);
            break;
        case "ec2ui.tabs.volumes":
            eval("ec2ui_VolumeTreeView." + toCall);
	    if(this.isOpenstackEndpointSelected()){
		eval("ec2ui_SnapshotTreeView." + toCall);
	    }
            break;
        case "ec2ui.tabs.bundleTasks":
        	if (this.isAmazonEndpointSelected()) {
            	eval("ec2ui_BundleTasksTreeView." + toCall);
			}
            break;
        case "ec2ui.tabs.availzones":
            eval("ec2ui_AvailZoneTreeView." + toCall);
            break;
        case "ec2ui.tabs.leases":
        	if (this.isAmazonEndpointSelected()) {
				eval("ec2ui_LeaseOfferingsTreeView." + toCall);
				eval("ec2ui_ReservedInstancesTreeView." + toCall);
			}
            break;
        default:
            log ("This is an invalid tab: " + tabs.selectedItem.id);
            break;
        }

        ec2ui_prefs.setCurrentTab(tabs.selectedIndex);
    },

    loadCredentials : function () {
        var activeCredsMenu = document.getElementById("ec2ui.active.credentials.list");
        activeCredsMenu.removeAllItems();

        var lastUsedCred = ec2ui_prefs.getLastUsedAccount();

        this.credentials = ec2ui_credentialManager.loadCredentials();
        for(var i in this.credentials) {
            activeCredsMenu.insertItemAt(
                    i,
                    this.credentials[i].name,
                    this.credentials[i].name
                    );
            if (lastUsedCred == this.credentials[i].name) {
                activeCredsMenu.selectedIndex = i;
            }
        }

        if (this.credentials.length == 0) {
            // invalidate all the views
            this.model.invalidate();
            // Reset the credentials stored in the client
            this.client.setCredentials("", "");
        }
    },

    getActiveCredential : function () {
        var activeCredsMenu = document.getElementById("ec2ui.active.credentials.list");

        if (this.credentials != null && this.credentials.length > 0) {
            if (activeCredsMenu.selectedIndex == -1) {
                activeCredsMenu.selectedIndex = 0;
            }
            return this.credentials[activeCredsMenu.selectedIndex];
        } else {
           return null;
        }
    },

    switchCredentials : function () {
        var activeCred = this.getActiveCredential();
        if (activeCred != null) {
	    var regionPref = activeCred.regionPref;
	    if (regionPref != null && regionPref != "") {
                this.endpointmap = ec2ui_prefs.getEndpointMap();
                var endpointlist = this.endpointmap.toArray(function(k,v){return new Endpoint(k, v.type, v.url)});
                for(var i in endpointlist) {
		    if (endpointlist[i].name == regionPref) {
                    document.getElementById("ec2ui.active.endpoints.list").selectedIndex = i;
                    var activeEndpoint = this.getActiveEndpoint();
                        if (activeEndpoint != null) {
                            ec2ui_prefs.setLastUsedEndpoint(activeEndpoint.name);
                            ec2ui_prefs.setServiceType(activeEndpoint.type);
                            ec2ui_prefs.setServiceURL(activeEndpoint.url);
                            this.client.setEndpoint(activeEndpoint);
		        }
	            }
	        }
	    }
            ec2ui_prefs.setLastUsedAccount(activeCred.name);
            this.client.setCredentials(activeCred.accessKey, activeCred.secretKey);
            this.loadAllTags();

            // Since we are switching creds, ensure that
            // all the views are redrawn
            this.model.invalidate();

            // Set the active tab to the last tab we were viewing
            document.getElementById("ec2ui.tabs").selectedIndex = ec2ui_prefs.getCurrentTab();

            // The current tab's view needs to either
            // be invalidated or refreshed
            this.tabSelectionChanged();
        } else {
            // There are no credentials in the system.
            // Let's ask the user to enter them
            var promptService =
                Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                .getService(Components.interfaces.nsIPromptService);
            var text = "Would you like to provide Hybridfox with your AWS Credentials?";

            // if the user says no, the return value will not be 0.
            // In this case, just fall out
            if (promptService.confirmEx(
                    window,
                    "AWS Credentials Needed",
                    text,
                    promptService.STD_YES_NO_BUTTONS |
                    promptService.BUTTON_POS_0_DEFAULT,
                    "",
                    "",
                    "",
                    null,
                    {})) {
                // Reset the credentials stored in the client
                this.client.setCredentials("", "");
            } else {
                this.manageCredentials();
            }
        }
    },

    manageEndpoints : function () {
        window.openDialog("chrome://ec2ui/content/dialog_manage_endpoints.xul",
                          null,
                          "chrome,centerscreen,modal",
                          this.endpointmap);
        this.loadEndpointMap();
    },

    getEndpoints : function () {
        return this.endpointmap.toArray(function(k,v) {
                                            return new Endpoint(k, v.type, v.url)
                                        });
    },

    loadEndpointMap : function() {
        this.endpointmap = ec2ui_prefs.getEndpointMap();
        var activeEndpointsMenu = document.getElementById("ec2ui.active.endpoints.list");
        activeEndpointsMenu.removeAllItems();

        var lastUsedEndpoint = ec2ui_prefs.getLastUsedEndpoint();
        var endpointlist = this.endpointmap.toArray(function(k,v){return new Endpoint(k, v.type, v.url)});

        for(var i in endpointlist) {
            activeEndpointsMenu.insertItemAt(
                i,
                endpointlist[i].name,
                endpointlist[i].name
                );
            if (lastUsedEndpoint == endpointlist[i].name) {
                activeEndpointsMenu.selectedIndex = i;
            }
        }
    },

    loadAllTags : function() {
        this.imageTags = ec2ui_prefs.getImageTags();
        this.instanceTags = ec2ui_prefs.getInstanceTags();
        this.volumeTags = ec2ui_prefs.getVolumeTags();
        this.snapshotTags = ec2ui_prefs.getSnapshotTags();
        this.eipTags = ec2ui_prefs.getEIPTags();
    },

    setResourceTag : function(id, tag) {
        if (!tag || tag.length == 0) return;

        tag = escape(tag);
        if (id.match(ec2ui_InstancesTreeView.instanceIdRegex)) {
            this.instanceTags.put(id, tag, "setInstanceTags");
        } else if (id.match(ec2ui_AMIsTreeView.imageIdRegex)) {
            this.imageTags.put(id, tag, "setImageTags");
        } else if (id.match(ec2ui_VolumeTreeView.imageIdRegex)) {
            this.volumeTags.put(id, tag, "setVolumeTags");
        } else if (id.match(ec2ui_SnapshotTreeView.imageIdRegex)) {
            this.snapshotTags.put(id, tag, "setSnapshotTags");
        } else if (id.match(ec2ui_ElasticIPTreeView.imageIdRegex)) {
            this.eipTags.put(id, tag, "setEIPTags");
        }
    },

    getResourceTag : function(id) {
        var tag = "";
        if (id.match(ec2ui_InstancesTreeView.instanceIdRegex)) {
            tag = this.instanceTags.get(id);
        } else if (id.match(ec2ui_VolumeTreeView.imageIdRegex)) {
            tag = this.volumeTags.get(id);
        } else if (id.match(ec2ui_SnapshotTreeView.imageIdRegex)) {
            tag = this.snapshotTags.get(id);
        } else if (id.match(regExs["ami"])) {
            tag = this.imageTags.get(id);
        } else if (id.match(ec2ui_ElasticIPTreeView.imageIdRegex)) {
            tag = this.eipTags.get(id);
        }

        if (tag) return unescape(tag);
        else return "";
    },

    getResourceTags : function(resourceType) {
        switch (resourceType) {
        case this.model.resourceMap.instances:
            return this.instanceTags;
        case this.model.resourceMap.volumes:
            return this.volumeTags;
        case this.model.resourceMap.snapshots:
            return this.snapshotTags;
        case this.model.resourceMap.images:
            return this.imageTags;
        case this.model.resourceMap.eips:
            return this.eipTags;
        default:
            return null;
        }
    },

    setResourceTags : function(resourceType, tags) {
        switch (resourceType) {
        case this.model.resourceMap.instances:
            // The Tags must first be persisted to the prefs store
            ec2ui_prefs.setInstanceTags(tags);

            this.instanceTags = null;
            // Retrieve the appropriate data structure from the store
            this.instanceTags = ec2ui_prefs.getInstanceTags();
            break;

        case this.model.resourceMap.volumes:
            // The Tags must first be persisted to the prefs store
            ec2ui_prefs.setVolumeTags(tags);

            this.volumeTags = null;
            // Retrieve the appropriate data structure from the store
            this.volumeTags = ec2ui_prefs.getVolumeTags();
            break;

        case this.model.resourceMap.snapshots:
            // The Tags must first be persisted to the prefs store
            ec2ui_prefs.setSnapshotTags(tags);

            this.snapshotTags = null;
            // Retrieve the appropriate data structure from the store
            this.snapshotTags = ec2ui_prefs.getSnapshotTags();
            break;

        case this.model.resourceMap.images:
            // The Tags must first be persisted to the prefs store
            ec2ui_prefs.setImageTags(tags);

            this.imageTags = null;
            // Retrieve the appropriate data structure from the store
            this.imageTags = ec2ui_prefs.getImageTags();
            break;

        case this.model.resourceMap.eips:
            // The Tags must first be persisted to the prefs store
            ec2ui_prefs.setEIPTags(tags);

            this.eipTags = null;
            // Retrieve the appropriate data structure from the store
            this.eipTags = ec2ui_prefs.getEIPTags();
            break;
        }
    },

    getActiveEndpoint : function () {
        var activeEndpointname = document.getElementById("ec2ui.active.endpoints.list").value;
        if (activeEndpointname == null || activeEndpointname.length == 0) {
            activeEndpointname = ec2ui_prefs.getLastUsedEndpoint();
        }
        if (this.endpointmap == null) {
            return new Endpoint(activeEndpointname, ec2ui_prefs.getServiceType(), ec2ui_prefs.getServiceURL());
			
        } else {
            return this.endpointmap.get(activeEndpointname);
        }
    },
    switchEndpoints : function () {
        var activeEndpoint = this.getActiveEndpoint();

        if (activeEndpoint != null) {
            ec2ui_prefs.setLastUsedEndpoint(activeEndpoint.name);
            ec2ui_prefs.setServiceType(activeEndpoint.type);
            ec2ui_prefs.setServiceURL(activeEndpoint.url);
            this.client.setEndpoint(activeEndpoint);
            this.loadAllTags();

            // Since we are switching creds, ensure that
            // all the views are redrawn
            this.model.invalidate();

            // Set the active tab to the last tab we were viewing
            document.getElementById("ec2ui.tabs").selectedIndex = ec2ui_prefs.getCurrentTab();

            // The current tab's view needs to either
            // be invalidated or refreshed
            this.tabSelectionChanged();
        } else {
            // There are no endpoints in the system.
            // Let's ask the user to enter them
            var promptService =
                Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                .getService(Components.interfaces.nsIPromptService);
            var text = "Would you like to provide Hybridfox with an EC2 Endpoint?";

            // if the user says no, the return value will not be 0.
            // in this case, just fall out.
            if (promptService.confirmEx(
                    window,
                    "EC2 Endpoint Needed",
                    text,
                    promptService.STD_YES_NO_BUTTONS |
                    promptService.BUTTON_POS_0_DEFAULT,
                    "",
                    "",
                    "",
                    null,
                    {})) {
                // Reset the endpoint stored in the client and prefs
                this.client.setEndpoint(new Endpoint());
                ec2ui_prefs.setServiceType("ec2");
                ec2ui_prefs.setServiceURL("");
            } else {
                this.manageEndpoints();
            }
        }
    },

    manageCredentials : function () {
        window.openDialog("chrome://ec2ui/content/dialog_manage_credentials.xul", null, "chrome,centerscreen, modal");
        this.loadCredentials();
    },

    manageTools : function () {
        window.openDialog("chrome://ec2ui/content/dialog_manage_tools.xul", null, "chrome,centerscreen,modal");
    },

    loadAccountIdMap : function () {
        this.accountidmap = ec2ui_prefs.getAccountIdMap();
    },

    manageAccountIds : function () {
        window.openDialog("chrome://ec2ui/content/dialog_manage_accountids.xul", null, "chrome,centerscreen,modal", this.accountidmap);
        this.loadAccountIdMap();
    },

    lookupAccountId : function(id) {
        if (this.accountidmap == null) {
           return id;
        }
        if (this.accountidmap.get(id) == null) {
           return id;
        }
        return this.accountidmap.get(id);
    },

    displayAbout : function () {
        window.openDialog("chrome://ec2ui/content/dialog_about.xul", null, "chrome,centerscreen,modal", ec2ui_session);
    },

    openURL : function(url) {
        window.open(url, "_new");
    },

    getApiVersion : function() {
        return this.client.API_VERSION;
    },

    showBusyCursor : function(fShow) {
        if (fShow) {
            document.getElementById("ec2ui-window").setAttribute("wait-cursor", true);
        } else {
            document.getElementById("ec2ui-window").removeAttribute("wait-cursor");
        }
    },

    openMainWindow: function () {
        var url = "chrome://ec2ui/content/ec2ui_main_window.xul";
        ec2ui_prefs.init();
        if (ec2ui_prefs.isOpenInNewTabEnabled()) {
            getBrowser().selectedTab = getBrowser().addTab(url);
        } else {
            getBrowser().selectedBrowser.contentDocument.location = url;
        }
    },
    
    isAmazonEndpointSelected: function () {
    	var activeEndpointType = this.getActiveEndpoint().type;
    	if (activeEndpointType.search(/ec2/)!=-1) { //if active endpoint type ends with "ece"
	    return true;
	}
	return false;
    },
    
    isOpenstackEndpointSelected: function () {
    	var activeEndpointType = this.getActiveEndpoint().type;
    	if (activeEndpointType.search(/ec2/)!=-1) { //if active endpoint type ends with "ec2"
	    return true;
	}else
	if (activeEndpointType.search(/euca/)!=-1) { //if active endpoint type ends with "ecua"
	    return true;
	}
	return false;
    }
	
    	
};
