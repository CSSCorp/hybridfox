var ec2ui_CloudformationTreeView = {
    COLNAMES : ['cloudformation.StackName','cloudformation.StackId','cloudformation.CreationTime','cloudformation.Status'],
    treeBox : null,
    selection : null,
    arrLocalFiles : new Array(),
    cloudformationList : new Array(),
    registered : false,

    get rowCount() { return this.cloudformationList.length; },

    setTree      : function(treeBox)            { this.treeBox = treeBox; },
    getCellText : function(idx, column) {
        if (idx >= this.rowCount) return "";
        var member = column.id.split(".").pop();
        return this.cloudformationList[idx][member];
    },
    
    isEditable: function(idx, column)  { return true; },
    isContainer: function(idx)            { return false;},
    isSeparator: function(idx)            { return false; },
    isSorted: function()                    { return false; },

    getImageSrc: function(idx, column) { return ""; },
    getProgressMode : function(idx,column) {},
    getCellValue: function(idx, column) {},
    cycleHeader: function(col) {
        cycleHeader(
        col,
        document,
        this.COLNAMES,
        this.cloudformationList);
        this.treeBox.invalidate();
        if (CloudFormation) {
            log(CloudFormation.CreationTime + ": Select this Cloudformation post sort");
            this.selectByName(CloudFormation.CreationTime);
        } else {
            log("The selected Cloudformation is null!");
        }
    },

    sort : function() {
        var CloudFormation = this.getSelectedcloudformation();
        sortView(document, this.COLNAMES, this.cloudformationList);
        if (CloudFormation) this.selectByName(CloudFormation.CreationTime);
    },

    selectionChanged: function() {},
    cycleCell: function(idx, column) {},
    performAction: function(action) {},
    performActionOnCell: function(action, index, column) {},
    getRowProperties: function(idx, column, prop) {},
    getCellProperties: function(idx, column, prop) {},
    getColumnProperties: function(column, element, prop) {},
    getLevel : function(idx) { return 0; },
    
    getSelectedcloudformation : function() {
        var index =  this.selection.currentIndex;
        if (index == -1) return null;
        return this.cloudformationList[index];
    },

    register: function() {
        if (!this.registered) {
            this.registered = true;
            ec2ui_model.registerInterest(this, 'cloudformation');
        }
    },

    invalidate: function() {
        this.displayCloudformation(ec2ui_session.model.cloudformation);
    },
    
    selectByName : function(CreationTime) {
        this.selection.clearSelection();
        for(var i in this.cloudformationList) {
            if (this.cloudformationList[i].CreationTime == CreationTime) {
                this.selection.select(i);
                this.treeBox.ensureRowIsVisible(i);
                return;
            }
        }
        // In case we don't find a match (which is probably a bug).
        this.selection.select(0);
    },
    
    selectionChanged : function() {
        var index = this.selection.currentIndex;
        if (index == -1) return;

        var group = this.cloudformationList[index];
        ec2ui_StackResourceTreeView.displayStackResource(group.Describeresource);
    },

    refresh: function() {
        ec2ui_session.controller.describeStack();
        
        var CloudFormation = this.getSelectedcloudformation();
        if (CloudFormation == null) return;
        ec2ui_session.controller.describeStackResources(CloudFormation.StackName);
    },

    notifyModelChanged: function(interest) {
        this.invalidate();
    },
    
    viewmore : function(event) {
        var CloudFormation = this.getSelectedcloudformation();
        if (CloudFormation == null) return;
        window.openDialog("chrome://ec2ui/content/dialog_cloudformation_details.xul",
                          null,
                          "chrome,centerscreen,modal",
                          CloudFormation
                          );
    },
    
    viewresources : function(event) {
      var CloudFormation = this.getSelectedcloudformation();
      if (CloudFormation == null) return;
       var me = this;
        var wrap = function() {
            if (ec2ui_prefs.isRefreshOnChangeEnabled()) {
            }
        }
        ec2ui_session.controller.describeStackResources(CloudFormation.StackName, wrap);
    },
    
    createstack : function() {
        var arrayParamss;
        
        var retVal = {ok:null,arrayParams:null};
        
        window.openDialog("chrome://ec2ui/content/dialog_create_stack.xul",
                          null,
                          "chrome,centerscreen,modal",
                          ec2ui_session,
                          retVal,
                          ec2ui_session.templatemap);
        var me = this;
        var wrap = function() {
            if (ec2ui_prefs.isRefreshOnChangeEnabled()) {
                me.refresh();
            }
        }
        
        ec2ui_session.controller.CreateStack(retVal.arrayParams, wrap);
    },
    
    deletestack : function(event) {
        var CloudFormation = this.getSelectedcloudformation();
        if (CloudFormation == null) return;
        var confirmed = confirm("Delete Cloudformation "+CloudFormation.StackName+"?");
        if (!confirmed)
            return;
        var me = this;
        var wrap = function() {
            if (ec2ui_prefs.isRefreshOnChangeEnabled()) {
                me.refresh();
            }
        }
        ec2ui_session.controller.deletecloudformation(CloudFormation.StackName, wrap); 
    },

    displayCloudformation : function (cloudformationList) {
        if (!cloudformationList) {
            cloudformationList = [];
        }
        
        this.treeBox.rowCountChanged(0, -this.cloudformationList.length);
        this.cloudformationList = cloudformationList;
        this.treeBox.rowCountChanged(0, this.cloudformationList.length);
        this.sort();
        this.selection.clearSelection();
        ec2ui_StackResourceTreeView.displayStackResource([]);
        if (cloudformationList.length > 0) {
            this.selection.select(0);
        }
    },
    
    manageTemplates : function () {
        window.openDialog("chrome://ec2ui/content/dialog_manage_templates.xul",
                          null,
                          "chrome,centerscreen,modal",
                          ec2ui_session.templatemap);      
    },
    
    getCFStack: function (url) {
        var httpRsp;
        alert(url);
        var httpRsp = ec2ui_session.client.makeCFStackHTTPRequest("GET",url);
        if (!httpRsp.hasErrors) {
            var xmlhttp = httpRsp.xmlhttp;
            if (xmlhttp) {
                var doc = xmlhttp.responseText;
                return doc;
            }
        }
        return null;
    }
};

ec2ui_CloudformationTreeView.register();
