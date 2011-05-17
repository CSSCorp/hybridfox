var ec2ui_credentialManager = {
    REALM : "chrome://ec2ui/",
    HOST  : "chrome://ec2ui/",
    credentials : new Array(),
	endpointmap : null,

    initDialog : function() {
	ec2ui_prefs.init();
        document.getElementById("ec2ui.credentials.view").view = ec2ui_credentialsTreeView;
        this.credentials = this.loadCredentials();
	this.loadRegionsList();
        ec2ui_credentialsTreeView.setAccountCredentials(this.credentials);
        document.getElementById("ec2ui.credentials.account").select();
    },

    indexOfAccountName : function(name) {
	name = name.trim();
        for (var i = 0; i < this.credentials.length; i++) {
            if (this.credentials[i].name.trim() == name) {
                return i;
            }
        }
        return -1;
    },

    loadCredentials : function () {
        var accountCredentials = new Array();

        if ("@mozilla.org/passwordmanager;1" in Components.classes) {
            // Password Manager exists so this is Firefox < 3

            var pwdManager = Components.classes["@mozilla.org/passwordmanager;1"].getService(Components.interfaces.nsIPasswordManager);

            var e = pwdManager.enumerator;
            while (e.hasMoreElements()) {
                try {
                    // get an nsIPassword object out of the password manager.
                    // This contains the actual password...
                    var pass = e.getNext().QueryInterface(Components.interfaces.nsIPassword);
                    if (pass.host == this.HOST) {
                        var credentials = pass.password.split(";;");
						var regionPref = (credentials.length>2)?credentials[2]:" ";
                        accountCredentials.push(new Credential(pass.user, credentials[0], credentials[1], regionPref));
						
                    }
                } catch (ex) {
                    // do something if decrypting the password failed--probably a continue
                    alert(ex);
                }
            }
        } else if ("@mozilla.org/login-manager;1" in Components.classes) {
            // Login Manager exists so this is Firefox 3

            var loginManager = Components.classes["@mozilla.org/login-manager;1"].getService(Components.interfaces.nsILoginManager);

            var logins = loginManager.findLogins({}, this.HOST, "", this.REALM);
            for (var i = 0; i < logins.length; i++) {
                var credentials = logins[i].password.split(";;");
				var regionPref = (credentials.length>2)?credentials[2]:" ";
                accountCredentials.push(new Credential(logins[i].username, credentials[0], credentials[1], regionPref));
            }
        }

        return accountCredentials;
    },

    loadRegionsList : function () {
		this.endpointmap = ec2ui_prefs.getLatestEndpointMap();
		var regionMenu = document.getElementById("ec2ui.credentials.regionpref");
		regionMenu.removeAllItems();

		var endpointlist = this.endpointmap.toArray(function(k,v){return new Endpoint(k,v.type,v.url)});
		for (var i in endpointlist) {
		  regionMenu.insertItemAt(i, endpointlist[i].name, endpointlist[i].name);
//		  if (lastUsedEndpoint == endpointlist[i].name) {
//		    regionMenu.selectedIndex = i;
//		  }
		}
	},

    removeAccount : function() {
        var name = document.getElementById("ec2ui.credentials.account").value.trim();
        var akid = document.getElementById("ec2ui.credentials.akid").value.trim();
        var secretKey = document.getElementById("ec2ui.credentials.secretkey").value.trim();
	var tmp = document.getElementById("ec2ui.credentials.regionpref").selectedItem;
	var regionPref = (tmp==null)?"":tmp.value;
        if (name.length > 0) {
            var index = this.indexOfAccountName(name);
            if (index != -1) {
                this.credentials.splice(index, 1);
            }

            if ("@mozilla.org/passwordmanager;1" in Components.classes) {
                // Password Manager exists so this is Firefox < 3
                var pwdManager = Components.classes["@mozilla.org/passwordmanager;1"].getService(Components.interfaces.nsIPasswordManager);

                if (pwdManager) {
                    try {
                        pwdManager.removeUser(this.HOST, name);
                    } catch (ex) {
                        alert(ex);
                    }
                }
            } else if ("@mozilla.org/login-manager;1" in Components.classes) {
                // Login Manager exists so this is Firefox 3

                if (akid == null || akid == "") return;
                if (secretKey == null || secretKey == "") return;

                var loginManager = Components.classes["@mozilla.org/login-manager;1"].getService(Components.interfaces.nsILoginManager);
                var nsLoginInfo = new Components.Constructor("@mozilla.org/login-manager/loginInfo;1",
                                                             Components.interfaces.nsILoginInfo,
                                                             "init");
                var loginR = new nsLoginInfo(this.HOST,
                                             null,
                                             this.REALM,
                                             name,
                                             akid + ";;" + secretKey + ";;" + regionPref || "",
                                             "",
                                             ""
                                            );
                loginManager.removeLogin(loginR);
            }

            ec2ui_credentialsTreeView.setAccountCredentials(this.credentials);
        }
    },

    saveAccount : function() {
        var name = document.getElementById("ec2ui.credentials.account").value.trim();
        var akid = document.getElementById("ec2ui.credentials.akid").value.trim();
        var secretKey = document.getElementById("ec2ui.credentials.secretkey").value.trim();
	var tmp = document.getElementById("ec2ui.credentials.regionpref").selectedItem;
	var regionPref = (tmp==null)?"":tmp.value;
        var prevCred = null;

        if (name == null || name == "") return;
        if (akid == null || akid == "") return;
        if (secretKey == null || secretKey == "") return;

        var credentialStr =  akid + ";;" + secretKey + ";;" + regionPref;
        var index = this.indexOfAccountName(name);
        var cred = new Credential(name, akid, secretKey, regionPref);
        if (index == -1) {
            this.credentials.push(cred);
        } else {
            prevCred = this.credentials[index];
            this.credentials[index] = cred;
        }

        if ("@mozilla.org/passwordmanager;1" in Components.classes) {
            // Password Manager exists so this is Firefox < 3
            var pwdManager = Components.classes["@mozilla.org/passwordmanager;1"].getService(Components.interfaces.nsIPasswordManager);

            if (pwdManager) {
                if (index != -1) {
                    try {
                        pwdManager.removeUser(this.HOST, name);
                    } catch (ex) {
                        alert(ex);
                    }
                }
                pwdManager.addUser(this.HOST, name, credentialStr);
            }
        } else if ("@mozilla.org/login-manager;1" in Components.classes) {
            // Login Manager exists so this is Firefox 3
            var loginManager = Components.classes["@mozilla.org/login-manager;1"].getService(Components.interfaces.nsILoginManager);
            var nsLoginInfo = new Components.Constructor("@mozilla.org/login-manager/loginInfo;1", Components.interfaces.nsILoginInfo, "init");
            var loginR = null;
            if (prevCred != null)
            {
                loginR = new nsLoginInfo(this.HOST,
                                             null,
                                             this.REALM,
                                             prevCred.name,
                                             prevCred.accessKey + ";;" + prevCred.secretKey + ";;" + prevCred.regionPref,
                                             "",
                                             ""
                                            );
            }

            var loginA = new nsLoginInfo(this.HOST,
                                         null,
                                         this.REALM,
                                         name,
                                         credentialStr,
                                         "",
                                         "");
            if (loginR) {
                loginManager.modifyLogin(loginR, loginA);
            } else {
                loginManager.addLogin(loginA);
            }
        }

        ec2ui_credentialsTreeView.setAccountCredentials(this.credentials);
    },

    packAccountNames : function(credentials) {
        var names = new Array();
        for (var i in credentials) {
            names.push(credentials[i].name);
        }
        return names.join(";;");
    },

    selectCredentials : function() {
        var sel = ec2ui_credentialsTreeView.getSelectedCredentials();
        if (sel != null) {
            document.getElementById("ec2ui.credentials.account").value = sel.name;
            document.getElementById("ec2ui.credentials.akid").value = sel.accessKey;
            document.getElementById("ec2ui.credentials.secretkey").value = sel.secretKey;
	    log("region pref :"+sel.regionPref);
	    var endpointlist = this.endpointmap.toArray(function(k,v){return new Endpoint(k,v.type,v.url)});
            document.getElementById("ec2ui.credentials.regionpref").selectedIndex = -1;
		for (var i in endpointlist) {
		    if (endpointlist[i].name == sel.regionPref) {
                        document.getElementById("ec2ui.credentials.regionpref").selectedIndex = i;
		    }
		}
        }
    }
}