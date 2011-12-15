var ec2ui_InstanceEventsTreeView = {
    COLNAMES : ['instanceevent.instanceId','instanceevent.availabilityZone','instanceevent.event',
                'instanceevent.description','instanceevent.startTime','instanceevent.endTime'],
    treeBox : null,
    selection : null,
    arrLocalFiles : new Array(),
    eventList : new Array(),
    registered : false,

    get rowCount() { return this.eventList.length; },

    setTree      : function(treeBox)            { this.treeBox = treeBox; },
    getCellText : function(idx, column) {
        if (idx >= this.rowCount) return "";
        var member = column.id.split(".").pop();
        return this.eventList[idx][member];
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
        this.eventList);
    },

    sort : function() {
        sortView(document, this.COLNAMES, this.eventList);
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
            ec2ui_model.registerInterest(this, 'instancestatus');
        }
    },
    
    getSelectedEvent : function() {
        var index = this.selection.currentIndex;
        return (index == -1) ? null : this.eventList[index];
    },

    invalidate: function() {
        this.displayEvent(ec2ui_session.model.instancestatus);
    },
    
    viewDetails : function(event) {
        var instancestatus = this.getSelectedEvent();
        if (instancestatus == null) return;
        window.openDialog("chrome://ec2ui/content/dialog_instancestatus_details.xul",
                          null,
                          "chrome,centerscreen,modal",
                          instancestatus);
    },

    refresh: function() {
        ec2ui_session.controller.describeInstanceStatus();
    },

    notifyModelChanged: function(interest) {
        this.invalidate();
    },

    displayEvent : function (eventList) {
        if (!eventList) { eventList = []; }

        this.treeBox.rowCountChanged(0, -this.eventList.length);
        this.eventList = eventList;
        this.treeBox.rowCountChanged(0, this.eventList.length);
        this.sort();
        this.selection.clearSelection();
        if (eventList.length > 0) {
            this.selection.select(0);
        }
    }
};

ec2ui_InstanceEventsTreeView.register();