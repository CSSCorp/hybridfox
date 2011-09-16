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
    },

    sort : function() {
        sortView(document, this.COLNAMES, this.cloudformationList);
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
            ec2ui_model.registerInterest(this, 'cloudformation');
        }
    },

    invalidate: function() {
        this.displayCloudformation(ec2ui_session.model.cloudformation);
    },

    refresh: function() {
        ec2ui_session.controller.describeStack();
    },

    notifyModelChanged: function(interest) {
        this.invalidate();
    },

    displayCloudformation : function (cloudformationList) {
        if (!cloudformationList) { cloudformationList = []; }

        this.treeBox.rowCountChanged(0, -this.cloudformationList.length);
        this.cloudformationList = cloudformationList;
        this.treeBox.rowCountChanged(0, this.cloudformationList.length);
        this.sort();
        this.selection.clearSelection();
        if (cloudformationList.length > 0) {
            this.selection.select(0);
        }
    }
};

ec2ui_CloudformationTreeView.register();
