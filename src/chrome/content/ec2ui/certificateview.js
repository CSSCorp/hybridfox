var ec2ui_ServerCertificateTreeView = {
    COLNAMES : ['ServerCertificate.ServerCertificateName','ServerCertificate.ServerCertificateId','ServerCertificate.Arn',
                'ServerCertificate.Path','ServerCertificate.UploadDate'],
    treeBox : null,
    selection : null,
    arrLocalFiles : new Array(),
    ServerCertificateList : new Array(),
    registered : false,

    get rowCount() { return this.ServerCertificateList.length; },

    setTree      : function(treeBox)            { this.treeBox = treeBox; },
    getCellText : function(idx, column) {
        if (idx >= this.rowCount) return "";
        var member = column.id.split(".").pop();
        return this.ServerCertificateList[idx][member];
    },
    isEditable: function(idx, column)  { return true; },
    isContainer: function(idx)            { return false;},
    isSeparator: function(idx)            { return false; },
    isSorted: function()                    { return false; },

    getImageSrc: function(idx, column) { return ""; },
    getProgressMode : function(idx,column) {},
    getCellValue: function(idx, column) {},
    cycleHeader: function(col) {
        var servercertificate = this.getSelectedServerCertificate();
        cycleHeader(
        col,
        document,
        this.COLNAMES,
        this.ServerCertificateList);
        if (servercertificate) {
            log(servercertificate.ServerCertificateName + ": Select this Certificate Name");
            this.selectByName(servercertificate.ServerCertificateName);
        } else {
            log("The selected Certificate Name is null!");
        }
    },

    sort : function() {
        var servercertificate = this.getSelectedServerCertificate();
        sortView(document, this.COLNAMES, this.ServerCertificateList);
        if (servercertificate) this.selectByName(servercertificate.ServerCertificateName);
    },
    
    getSelectedServerCertificate : function() {
        var index =  this.selection.currentIndex;
        if (index == -1) return null;
        return this.ServerCertificateList[index];
    },
    
    selectByName : function(Value) {
        this.selection.clearSelection();
        for(var i in this.ServerCertificateList) {
             if (this.ServerCertificateList[i].ServerCertificateName == ServerCertificateName) {
                this.selection.select(i);
                this.treeBox.ensureRowIsVisible(i);
                return;
            }
        }
        this.selection.select(0);
    },

    selectionChanged: function() {},
    cycleCell: function(idx, column) {},
    performAction: function(action) {},
    performActionOnCell: function(action, index, column) {},
    getRowProperties: function(idx, column, prop) {},
    getCellProperties: function(idx, column, prop) {},
    getColumnProperties: function(column, element, prop) {},
    getLevel : function(idx) { return 0; },

    register: function() {
        if (!this.registered) {
            this.registered = true;
            ec2ui_model.registerInterest(this, 'ServerCertificate');
        }
    },
    
    viewDetails : function() {
        var servercertificate = this.getSelectedServerCertificate();
        if (servercertificate == null) return;
        window.openDialog(
            "chrome://ec2ui/content/dialog_certificate_details.xul",
            null,
            "chrome,centerscreen,modal",
            servercertificate);
    },
    
    openServerCertAddWindow : function() {
		var retVal = {ok:null};
		window.openDialog("chrome://ec2ui/content/dialog_server_certificate.xul",
						  null,
                          "chrome,centerscreen,modal",
                          ec2ui_session,
                          retVal,
                          null
                          );
        var me = this;
        var wrap = function() {
            if (ec2ui_prefs.isRefreshOnChangeEnabled()) {
                me.refresh();
            }
        }
        if (retVal.ok) {
			ec2ui_session.controller.uploadservercertificate(retVal.ServerCertificateName,retVal.CertificateBody,retVal.PrivateKey,retVal.Path);
			wrap();
		}
      
	},
     
    copyToClipBoard : function(fieldName) {
        var servercertificate = this.getSelectedServerCertificate();
        if (servercertificate == null) {
            return;
        }
        
        copyToClipboard(servercertificate[fieldName]);
    },
    
    deleteServerCertificate : function() {
        var servercertificate = this.getSelectedServerCertificate();
        if (servercertificate == null) return;
        var confirmed = confirm("Delete Server Certificate"+servercertificate.ServerCertificateName+"?");
        if (!confirmed)
            return;
        var me = this;
        var wrap = function() {
            if (ec2ui_prefs.isRefreshOnChangeEnabled()) {
                me.refresh();
            }
        }
        ec2ui_session.controller.deleteServerCertificate(servercertificate.ServerCertificateName, wrap);     
    },

    invalidate: function() {
        this.displayServerCertificate(ec2ui_session.model.ServerCertificate);
    },

    refresh: function() {
        ec2ui_session.controller.describeServerCertificate();
    },

    notifyModelChanged: function(interest) {
        this.invalidate();
    },

    displayServerCertificate : function (ServerCertificateList) {
        if (!ServerCertificateList) { ServerCertificateList = []; }

        this.treeBox.rowCountChanged(0, -this.ServerCertificateList.length);
        this.ServerCertificateList = ServerCertificateList;
        this.treeBox.rowCountChanged(0, this.ServerCertificateList.length);
        this.sort();
        this.selection.clearSelection();
        if (ServerCertificateList.length > 0) {
            this.selection.select(0);
        }
    }
};

ec2ui_ServerCertificateTreeView.register();
