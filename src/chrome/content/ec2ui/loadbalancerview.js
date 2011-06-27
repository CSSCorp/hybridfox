var ec2ui_LoadbalancerTreeView = {
    COLNAMES : ['loadbalancer.LoadBalancerName','loadbalancer.CreatedTime','loadbalancer.DNSName','loadbalancer.InstanceId',
                'loadbalancer.Interval','loadbalancer.Timeout','loadbalancer.HealthyThreshold','loadbalancer.UnhealthyThreshold',
                'loadbalancer.Target','loadbalancer.zone'],
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
    
    create: function() {
        var retVal = {ok:null};
        window.openDialog(
            "chrome://ec2ui/content/dialog_create_loadbalancer.xul",
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
                ec2ui_session.controller.CreateLoadBalancer(retVal.LoadBalancerName,retVal.Protocol,retVal.elbport,retVal.instanceport,wrap);
                ec2ui_session.controller.ConfigureHealthCheck(retVal.LoadBalancerName,retVal.pingprotocol,retVal.pingport,retVal.pingpath,retVal.Interval,retVal.Timeout,retVal.HealthyThreshold,retVal.UnhealthyThreshold,wrap);
                ec2ui_session.controller.RegisterInstancesWithLoadBalancer(retVal.LoadBalancerName,retVal.Instances,wrap);
        }
     },
     
     ConfigureHealthCheck: function() {
        var loadbalancer = this.getSelectedLoadbalancer();
        if (loadbalancer == null) return;
        var retVal = {ok:null};
        window.openDialog(
            "chrome://ec2ui/content/dialog_configure_healthcheck.xul",
            null,
            "chrome,centerscreen,modal",
            loadbalancer,
            ec2ui_session,
            retVal            
           );
        var me = this;
        var wrap = function() {
            if (ec2ui_prefs.isRefreshOnChangeEnabled()) {
                me.refresh();
            }
        }
        if (retVal.ok) {        
            ec2ui_session.controller.EditHealthCheck(loadbalancer.LoadBalancerName,retVal.Target,retVal.Interval,retVal.Timeout,retVal.HealthyThreshold,retVal.UnhealthyThreshold,wrap);
        }
    },
    
    registerinstances : function(){
        var loadbalancer = this.getSelectedLoadbalancer();
        if (loadbalancer == null) return;
        var retVal = {ok:null};
         window.openDialog(
            "chrome://ec2ui/content/dialog_register_lbinstances.xul",
            null,
            "chrome,centerscreen,modal",
            ec2ui_session,
            retVal,
            loadbalancer
            );
        var me = this;
        var wrap = function() {
            if (ec2ui_prefs.isRefreshOnChangeEnabled()) {
                me.refresh();
            }
        }
        if (retVal.ok) {
        ec2ui_session.controller.RegisterInstancesWithLoadBalancer(retVal.LoadBalancerName,retVal.Instances,wrap);
        }    
    },
    
    deregisterinstances : function(){
        var loadbalancer = this.getSelectedLoadbalancer();
        if (loadbalancer == null) return;
        var retVal = {ok:null};
         window.openDialog(
            "chrome://ec2ui/content/dialog_deregister_lbinstances.xul",
            null,
            "chrome,centerscreen,modal",
            ec2ui_session,
            retVal,
            loadbalancer
            );
        var me = this;
        var wrap = function() {
            if (ec2ui_prefs.isRefreshOnChangeEnabled()) {
                me.refresh();
            }
        }
        if (retVal.ok) {
        ec2ui_session.controller.DeregisterInstancesWithLoadBalancer(retVal.LoadBalancerName,retVal.Instances,wrap);
        } 
    },
    
    enableazone : function(){
        var loadbalancer = this.getSelectedLoadbalancer();
        if (loadbalancer == null) return;
        var retVal = {ok:null};
        window.openDialog(
            "chrome://ec2ui/content/dialog_enable_lbazone.xul",
            null,
            "chrome,centerscreen,modal",
            ec2ui_session,
            retVal,
            loadbalancer
        );
        var me = this;
        var wrap = function() {
            if (ec2ui_prefs.isRefreshOnChangeEnabled()) {
                me.refresh();
            }
        }
        if (retVal.ok) {
            ec2ui_session.controller.Enableazonewithloadbalancer(retVal.LoadBalancerName,retVal.Zone,wrap);
        } 
    },
    
    disableazone : function(){
        var loadbalancer = this.getSelectedLoadbalancer();
        if (loadbalancer == null) return;
        var retVal = {ok:null};
        window.openDialog(
            "chrome://ec2ui/content/dialog_disable_lbazone.xul",
            null,
            "chrome,centerscreen,modal",
            ec2ui_session,
            retVal,
            loadbalancer
        );
         var me = this;
        var wrap = function() {
            if (ec2ui_prefs.isRefreshOnChangeEnabled()) {
                me.refresh();
            }
        }
        if (retVal.ok) {
            ec2ui_session.controller.Disableazonewithloadbalancer(retVal.LoadBalancerName,retVal.Zone,wrap);
        } 
        
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
