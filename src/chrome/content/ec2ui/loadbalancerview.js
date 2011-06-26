var ec2ui_LoadbalancerTreeView = {
    COLNAMES : ['loadbalancer.LoadBalancerName','loadbalancer.CreatedTime','loadbalancer.DNSName','loadbalancer.InstanceId',
                'loadbalancer.Interval','loadbalancer.Timeout','loadbalancer.HealthyThreshold','loadbalancer.UnhealthyThreshold',
                'loadbalancer.Target'],
    treeBox : null,
    selection : null,
    arrLocalFiles : new Array(),
    loadbalancerList : new Array(),
    registered : false,

    get rowCount() { return this.loadbalancerList.length;},

    setTree      : function(treeBox)            { this.treeBox = treeBox; },
    getCellText : function(idx, column) {
        if (idx >= this.rowCount) return "";
        var member = column.id.split(".").pop();
        return this.loadbalancerList[idx][member];
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
        this.loadbalancerList);
        this.treeBox.invalidate();
        if (loadbalancer) {
            log(loadbalancer.LoadBalancerName + ": Select this Monitor Instance post sort");
            this.selectByName(LoadBalancer.LoadBalancerName);
        } else {
            log("The selected Monitor Instance is null!");
        }
    },

    sort : function() {
        var LoadBalancer = this.getSelectedLoadbalancer();
        sortView(document, this.COLNAMES, this.loadbalancerList);
        if (LoadBalancer) this.selectByName(LoadBalancer.LoadBalancerName);
    },

    selectionChanged: function() {},
    cycleCell: function(idx, column) {},
    performAction: function(action) {},
    performActionOnCell: function(action, index, column) {},
    getRowProperties: function(idx, column, prop) {},
    getCellProperties: function(idx, column, prop) {},
    getColumnProperties: function(column, element, prop) {},
    getLevel : function(idx) { return 0; },
    
    getSelectedLoadbalancer : function() {
        var index =  this.selection.currentIndex;
        if (index == -1) return null;
        return this.loadbalancerList[index];
    },
    
    selectByName : function(Value) {
        this.selection.clearSelection();
        for(var i in this.loadbalancerList) {
             if (this.loadbalancerList[i].LoadBalancerName == LoadBalancerName) {
                this.selection.select(i);
                this.treeBox.ensureRowIsVisible(i);
                return;
            }
        }
        this.selection.select(0);
    },

    register: function() {
        if (!this.registered) {
            this.registered = true;
            ec2ui_model.registerInterest(this, 'loadbalancer');
        }
    },

    invalidate: function() {
        this.displayLoadbalancer(ec2ui_session.model.loadbalancer);
    },

    refresh: function() {
        ec2ui_session.controller.describeLoadBalancers();
    },

    notifyModelChanged: function(interest) {
        this.invalidate();
    },
    
    deleteLoadBalancer : function(){
        var loadbalancer = this.getSelectedLoadbalancer();
        if (loadbalancer == null) return;
        var confirmed = confirm("Delete Loadbalancer "+loadbalancer.LoadBalancerName+"?");
        if (!confirmed)
            return;
        var me = this;
        var wrap = function() {
            if (ec2ui_prefs.isRefreshOnChangeEnabled()) {
                me.refresh();
            }
        }
        ec2ui_session.controller.deleteLoadBalancer(loadbalancer.LoadBalancerName, wrap);     
    },
    
    viewDetails : function(){
        var loadbalancer = this.getSelectedLoadbalancer();
        if (loadbalancer == null) return;
        window.openDialog(
            "chrome://ec2ui/content/dialog_loadbalancer_details.xul",
            null,
            "chrome,centerscreen,modal",
            loadbalancer);
    },
    
    displayLoadbalancer : function (loadbalancerList) {
        if (!loadbalancerList) { loadbalancerList = []; }

        this.treeBox.rowCountChanged(0, -this.loadbalancerList.length);
        this.loadbalancerList = loadbalancerList;
        this.treeBox.rowCountChanged(0, this.loadbalancerList.length);
        this.sort();
        this.selection.clearSelection();
        if (loadbalancerList.length > 0) {
            this.selection.select(0);
        }
    }
};

ec2ui_LoadbalancerTreeView.register();
