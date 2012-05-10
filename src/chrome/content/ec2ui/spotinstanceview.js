var ec2ui_SpotInstanceTreeView = {
    COLNAMES : ['spotinstance.requestId','spotinstance.spotPrice','spotinstance.type','spotinstance.state',
                'spotinstance.imageId','spotinstance.keyName','spotinstance.instanceType','spotinstance.instanceId',
                'spotinstance.createTime','spotinstance.productDescription','spotinstance.launchedAvailabilityZone'],
    treeBox : null,
    selection : null,
    arrLocalFiles : new Array(),
    spotinstanceList : new Array(),
    registered : false,

    get rowCount() { return this.spotinstanceList.length; },

    setTree      : function(treeBox)            { this.treeBox = treeBox; },
    getCellText : function(idx, column) {
        if (idx >= this.rowCount) return "";
        var member = column.id.split(".").pop();
        return this.spotinstanceList[idx][member];
    },
    isEditable: function(idx, column)  { return true; },
    isContainer: function(idx)            { return false;},
    isSeparator: function(idx)            { return false; },
    isSorted: function()                    { return false; },

    getImageSrc: function(idx, column) { return ""; },
    getProgressMode : function(idx,column) {},
    getCellValue: function(idx, column) {},
    cycleHeader: function(col) {
        var spotinstance = this.getSelectedSpotInstance();
        cycleHeader(
            col,
            document,
            this.COLNAMES,
            this.spotinstanceList
            );
        if (eip) {
            log(spotinstance.requestId + ": Select this eip post sort");
            this.selectByAddress(spotinstance.requestId);
        } else {
            log("The selected eip is null!");
        }
    },

    sort : function() {
        var spotinstanceSel = this.getSelectedSpotInstance();
        sortView(document, this.COLNAMES, this.spotinstanceList);
        if (spotinstanceSel) this.selectByAddress(spotinstanceSel.requestId);
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
            ec2ui_model.registerInterest(this, 'spotinstances');
        }
    },

    invalidate: function() {
        this.displaySpotInstances(ec2ui_session.model.spotinstances);
    },

    refresh: function() {
        ec2ui_session.controller.decribeSpotInstance();
    },

    notifyModelChanged: function(interest) {
        this.invalidate();
    },
    
    selectByAddress: function(requestId) {
        this.selection.clearSelection();
        for(var i in this.spotinstanceList) {
            if (this.spotinstanceList[i].requestId == requestId) {
                this.selection.select(i);
                this.treeBox.ensureRowIsVisible(i);
                return;
            }
        }

        // In case we don't find a match (which is probably a bug).
        this.selection.select(0);
    },

    getSelectedSpotInstance : function() {
        var index =  this.selection.currentIndex;
        if (index == -1) return null;
        return this.spotinstanceList[index];
    },
    
    viewDetails : function(){
        var spotinstance = this.getSelectedSpotInstance();

        if (spotinstance == null) {
            return;
        }

        window.openDialog(
            "chrome://ec2ui/content/dialog_spotinstance_details.xul",
            null,
            "chrome,centerscreen,modal",
            ec2ui_session,
            spotinstance
            );
    },
    
    delete_spotprice : function(){
        var spotinstance = this.getSelectedSpotInstance();
        if (spotinstance == null) return;
        var confirmed = confirm(ec2ui_utils.getMessageProperty("ec2ui.msg.spotprice.confirm.delete", [spotinstance.requestId]));
        if (!confirmed)
            return;

        var me = this;
        var wrap = function() {
            if (ec2ui_prefs.isRefreshOnChangeEnabled()) {
                me.refresh();
            }
        }
        ec2ui_session.controller.cancelSpotInstances(spotinstance.requestId, wrap);
        ec2ui_session.popup("Spot Price Cancel Request","Spot Price with Request ID : "+ spotinstance.requestId +" cancelled successfully!");
    },

    displaySpotInstances : function (spotinstanceList) {
        if (!spotinstanceList) { spotinstanceList = []; }

        this.treeBox.rowCountChanged(0, -this.spotinstanceList.length);
        this.spotinstanceList = spotinstanceList;
        this.treeBox.rowCountChanged(0, this.spotinstanceList.length);
        this.sort();
        this.selection.clearSelection();
        if (spotinstanceList.length > 0) {
            this.selection.select(0);
        }
    }
};

ec2ui_SpotInstanceTreeView.register();