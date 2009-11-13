var ec2_InstanceLauncher = {
    image : null,
    ec2ui_session : null,
    retVal : null,
    unusedSecGroupsList : null,
    usedSecGroupsList : null,
    unused : new Array(),
    used : new Array(),

    launch : function() {
        if (!this.validateMin()) return false;
        if (!this.validateMax()) return false;

        this.retVal.imageId = this.image.id;
        this.retVal.kernelId = document.getElementById("ec2ui.newinstances.aki").value;
        this.retVal.ramdiskId = document.getElementById("ec2ui.newinstances.ari").value;
        this.retVal.instanceType = document.getElementById("ec2ui.newinstances.instancetypelist").selectedItem.value;
        this.retVal.minCount = document.getElementById("ec2ui.newinstances.min").value.trim();
        this.retVal.maxCount = document.getElementById("ec2ui.newinstances.max").value.trim();
        this.retVal.tag = document.getElementById("ec2ui.newinstances.tag").value.trim();

        // This will be an empty string if <none> is selected
        this.retVal.keyName = document.getElementById("ec2ui.newinstances.keypairlist").selectedItem.value;

        // This will be an empty string if <any> is selected
        var a = document.getElementById("ec2ui.newinstances.availabilityzonelist").selectedItem.value;
        this.retVal.placement = {
            "availabilityZone": document.getElementById("ec2ui.newinstances.availabilityzonelist").selectedItem.value
        };

        this.retVal.securityGroups = this.used;
        this.retVal.userData = document.getElementById("ec2ui.newinstances.userdata").value;
        if (this.retVal.userData == "") {
            this.retVal.userData = null;
        }
        this.retVal.properties = document.getElementById("ec2ui.newinstances.properties").value;
        if (this.retVal.properties == "") {
            this.retVal.properties = null;
        }
        this.retVal.ok = true;

        return true;
    },

    validateMin : function() {
        var textbox = document.getElementById("ec2ui.newinstances.min");
        var val = parseInt(textbox.value);
        if (val <= 0 || isNaN(val)) {
            alert("Minimum value must be a positive integer");
            textbox.select();
            return false;
        }
        return true;
    },

    validateMax : function() {
        // Assumes validateMin has been called
        var maxtextbox = document.getElementById("ec2ui.newinstances.max");
        var maxval = parseInt(maxtextbox.value);
        if (maxval <= 0 || isNaN(maxval)) {
            alert("Maximum value must be a positive integer");
            maxtextbox.select();
            return false;
        }
        var mintextbox = document.getElementById("ec2ui.newinstances.min");
        var minval = parseInt(mintextbox.value);
        if (minval > maxval) {
            alert("Maximum value may not be smaller than minimum value");
            maxtextbox.select();
            return false;
        }
        return true;
    },

    addSecurityGroup : function() {
        this.unused = [];
        for(var i = 0; i < this.unusedSecGroupsList.getRowCount(); i++) {
            var item = this.unusedSecGroupsList.getItemAtIndex(i);
            if (item.selected) {
                this.used.push(item.label);
            } else {
                this.unused.push(item.label);
            }
        }
        this.refreshDisplay();
    },

    removeSecurityGroup : function() {
        this.used = [];
        for(var i = 0; i < this.usedSecGroupsList.getRowCount(); i++) {
            var item = this.usedSecGroupsList.getItemAtIndex(i);
            if (item.selected) {
                this.unused.push(item.label);
            } else {
                this.used.push(item.label);
            }
        }
        this.refreshDisplay();
    },

    loadUserDataFromFile : function(fBinary) {
        var nsIFilePicker = Components.interfaces.nsIFilePicker;
        var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
        fp.init(window, "Load user data", nsIFilePicker.modeLoad);
        fp.appendFilters(nsIFilePicker.filterAll);

        var res = fp.show();
        if (res == nsIFilePicker.returnOK) {
            var userdataFile = fp.file;
            var inputStream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance( Components.interfaces.nsIFileInputStream );
            // Open the file for read (01)
            inputStream.init(userdataFile, 0x01, 0400, null);
            var sis = null;
            var contents = null;
            if (fBinary) {
                sis = Components.classes["@mozilla.org/binaryinputstream;1"].createInstance(Components.interfaces.nsIBinaryInputStream);
                sis.setInputStream(inputStream);
                contents = sis.readByteArray(sis.available());
                contents = "Base64:" + Base64.encode(contents);
            } else {
                sis = Components.classes["@mozilla.org/scriptableinputstream;1"].createInstance(Components.interfaces.nsIScriptableInputStream);
                sis.init(inputStream);
                contents = sis.read(sis.available());
            }

            inputStream.close();

            document.getElementById("ec2ui.newinstances.userdata").value = contents;
        }
    },

    init : function() {
        this.image = window.arguments[0];
        this.ec2ui_session = window.arguments[1];
        this.retVal = window.arguments[2];

        // Get the list of keypair names visible to this user.
        // This will trigger a DescribeKeyPairs if the model
        // doesn't have any keypair info yet. If there are no keypairs,
        // this dialog shouldn't be initialized any further.
        var keypairs = this.ec2ui_session.model.getKeypairs();
        if (keypairs == null) {
            alert ("Please create a keypair before launching an instance");
            return false;
        }

        var keypairMenu = document.getElementById("ec2ui.newinstances.keypairlist");
        keypairMenu.appendItem("<none>", null);
        for(var i in keypairs) {
            keypairMenu.appendItem(keypairs[i].name, keypairs[i].name);
        }
        // If the user created at least one EC2 Keypair, select it.
        keypairMenu.selectedIndex = (keypairs.length > 0) ? 1 : 0;

        var typeMenu = document.getElementById("ec2ui.newinstances.instancetypelist");
        // Add the instance sizes based on AMI architecture
        if (this.image.arch == "x86_64") {
            //Just checking for eucalyptus or not
            region = getActiveRegion(this.ec2ui_session.getActiveEndpoint());
            if (region.search(/^us$/i) == -1 && region.search(/^eu$/i) == -1 ) {
                typeMenu.appendItem("m1.small", "m1.small");
                typeMenu.appendItem("c1.medium", "c1.medium");
                typeMenu.appendItem("m1.large", "m1.large");
                typeMenu.appendItem("m1.xlarge", "m1.xlarge");
                typeMenu.appendItem("c1.xlarge", "c1.xlarge");
            }
            else {
                typeMenu.appendItem("m1.large", "m1.large");
                typeMenu.appendItem("m1.xlarge", "m1.xlarge");
                typeMenu.appendItem("c1.xlarge", "c1.xlarge");
                
            }
        } else {
            //Just checking for eucalyptus or not
            region = getActiveRegion(this.ec2ui_session.getActiveEndpoint());
            if (region.search(/^us$/i) == -1 && region.search(/^eu$/i) == -1 ) {
                typeMenu.appendItem("m1.small", "m1.small");
                typeMenu.appendItem("c1.medium", "c1.medium");
                typeMenu.appendItem("m1.large", "m1.large");
                typeMenu.appendItem("m1.xlarge", "m1.xlarge");
                typeMenu.appendItem("c1.xlarge", "c1.xlarge");
            }
            else { 
                typeMenu.appendItem("m1.small", "m1.small");
                typeMenu.appendItem("c1.medium", "c1.medium");
            }
        }
        typeMenu.selectedIndex = 0;

        var textBox = document.getElementById("ec2ui.newinstances.ami");
        textBox.value = this.image.id;

        textBox = document.getElementById("ec2ui.newinstances.ami.tag");
        textBox.value = this.image.tag || "";

        textBox = document.getElementById("ec2ui.newinstances.ami.location");
        textBox.value = this.image.location.split('/').pop();

        textBox = document.getElementById("ec2ui.newinstances.min");
        textBox.focus();

        // availability zones
        var availZoneMenu = document.getElementById("ec2ui.newinstances.availabilityzonelist");
        availZoneMenu.appendItem("<any>", null);
        var availZones = this.ec2ui_session.model.getAvailabilityZones();
        for (var i in availZones) {
            availZoneMenu.appendItem(availZones[i].name + " (" + availZones[i].state + ")", availZones[i].name);
        }
        availZoneMenu.selectedIndex = 0;

        // Grab handles to the unused and used security group lists.
        this.unusedSecGroupsList = document.getElementById("ec2ui.newinstances.secgroups.unused");
        this.usedSecGroupsList = document.getElementById("ec2ui.newinstances.secgroups.used");

        // Get the list of security groups visible to this user. This will trigger a DescribeSecurityGroups
        // if the model doesn't have any info yet.
        var securityGroups = this.ec2ui_session.model.getSecurityGroups();

        // Then add the default group to the used list. EC2 will do this anyway if no group is provided,
        // but this way it's obvious to the user what's happening.
        i = 0;
        for (i in securityGroups) {
            if (securityGroups[i].name == "default") {
                this.used.push(securityGroups[i].name);
            } else {
                this.unused.push(securityGroups[i].name);
            }
        }

        var aki = this.image.aki;
        var ari = this.image.ari;

        // Populate the AKI and ARI lists
        var akiList = document.getElementById("ec2ui.newinstances.aki");
        var ariList = document.getElementById("ec2ui.newinstances.ari");
        var images = this.ec2ui_session.model.getImages();
        var akiRegex = regExs["aki"];
        var ariRegex = regExs["ari"];
        akiList.appendItem("");
        ariList.appendItem("");

        if (!isWindows(this.image.platform)) {
            i = 0;
            var imgId = null;
            for (i in images) {
                imgId = images[i].id;
                if (imgId.match(akiRegex)) {
                    akiList.appendItem(imgId);
                    continue;
                }

                if (imgId.match(ariRegex)) {
                    ariList.appendItem(imgId);
                }
            }

            akiList.value = aki;
            ariList.value = ari;

            // The use of selectedIndex doesn't work predictably for
            // editable menulists
        }

        this.refreshDisplay();
    },

    refreshDisplay : function() {
        while(this.unusedSecGroupsList.getRowCount() > 0) { this.unusedSecGroupsList.removeItemAt(0); }
        while(this.usedSecGroupsList.getRowCount() > 0) { this.usedSecGroupsList.removeItemAt(0); }

        this.unused.sort();
        this.used.sort();

        for(var i in this.unused) { this.unusedSecGroupsList.appendItem(this.unused[i]); }
        for(var i in this.used) { this.usedSecGroupsList.appendItem(this.used[i]); }
    }
}
