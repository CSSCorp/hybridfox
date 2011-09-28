var ec2ui_StackResourceTreeView = {
    COLNAMES : ['Describeresource.Timestamp','Describeresource.ResourceStatus','Describeresource.StackId','Describeresource.LogicalResourceId','Describeresource.PhysicalResourceId','Describeresource.ResourceType'],
    treeBox : null,
    selection : null,
    arrLocalFiles : new Array(),
    stackresourceList : new Array(),
    registered : false,

    get rowCount() { return this.stackresourceList.length; },

    setTree      : function(treeBox)            { this.treeBox = treeBox; },
    getCellText : function(idx, column) {
        if (idx >= this.rowCount) return "";
        var member = column.id.split(".").pop();
        return this.stackresourceList[idx][member];
    },
    isEditable: function(idx, column)  { return true; },
    isContainer: function(idx)            { return false;},
    isSeparator: function(idx)            { return false; },
    isSorted: function()                    { return false; },

    getImageSrc: function(idx, column) { return ""; },
    getProgressMode : function(idx,column) {},
    getCellValue: function(idx, column) {},
    cycleHeader: function(col) {
    var Describeresource = this.getSelectedresource();  
        cycleHeader(col,
                    document,
                    this.COLNAMES,
                    this.stackresourceList);
        this.treeBox.invalidate();
        if (Describeresource) {
            log(Describeresource.Timestamp + ": Select this Cloudformation post sort");
            this.selectByName(Describeresource.Timestamp);
        } else {
            log("The selected Cloudformation is null!");
        }
    },
    
    sort : function() {
       var Describeresource = this.getSelectedresource();
       sortView(document, this.COLNAMES, this.stackresourceList);
       if (Describeresource) this.selectByName(Describeresource.Timestamp);
    },

    selectionChanged: function() {},
    cycleCell: function(idx, column) {},
    performAction: function(action) {},
    performActionOnCell: function(action, index, column) {},
    getRowProperties: function(idx, column, prop) {},
    getCellProperties: function(idx, column, prop) {},
    getColumnProperties: function(column, element, prop) {},
    getLevel : function(idx) { return 0; },
    
    getSelectedresource : function() {
        var index =  this.selection.currentIndex;
        if (index == -1) return null;
        return this.stackresourceList[index];
    },
    
    selectByName : function(Timestamp) {
        this.selection.clearSelection();
        for(var i in this.stackresourceList) {
            if (this.stackresourceList[i].Timestamp == Timestamp)
            {
                this.selection.select(i);
                this.treeBox.ensureRowIsVisible(i);
                return;
            }
        }
        // In case we don't find a match (which is probably a bug).
        this.selection.select(0);
    },
    
    viewmore : function(event) {
        var Describeresource = this.getSelectedresource();
        if (Describeresource == null) return;
        window.openDialog("chrome://ec2ui/content/dialog_stackresource_details.xul",
                          null,
                          "chrome,centerscreen,modal",
                          Describeresource);
    },

    register: function() {
        if (!this.registered) {
            this.registered = true;
            ec2ui_model.registerInterest(this, 'Describeresource');
        }
    },

    invalidate: function() {
        this.displayStackResource(ec2ui_session.model.Describeresource);
    },

    refresh: function() {
        ec2ui_session.controller.DescribeStackResources();
    },

    notifyModelChanged: function(interest) {
        this.invalidate();
    },

    displayStackResource : function (stackresourceList) {
        if (!stackresourceList) { stackresourceList = []; }

        this.treeBox.rowCountChanged(0, -this.stackresourceList.length);
        this.stackresourceList = stackresourceList;
        this.treeBox.rowCountChanged(0, this.stackresourceList.length);
        this.sort();
        this.selection.clearSelection();
        if (stackresourceList.length > 0) {
            this.selection.select(0);
        }
    }
};

ec2ui_StackResourceTreeView.register();