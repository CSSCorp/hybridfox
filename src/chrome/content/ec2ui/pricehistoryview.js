var ec2ui_PriceHistoryTreeView = {
	
	zonelist : function(){
        var ZoneMenu = document.getElementById("ec2ui.pricehistory.Zonelist");
        var Zone = ec2ui_session.model.getAvailabilityZones();
		var count = ZoneMenu.itemCount;
		while(count-- > 0){
			ZoneMenu.removeItemAt(0);
		}
        for (var i in Zone) {
		ZoneMenu.appendItem(Zone[i].name , Zone[i].name);
        }
        ZoneMenu.selectedIndex = 0;
    },
	
	selectedMetric : function(){
		var type = document.getElementById("pricehistory.type").value;
		var product = document.getElementById("pricehistory.product").value;
		var zone = document.getElementById("ec2ui.pricehistory.Zonelist").value;		
		 
		ec2ui_session.controller.decribePriceHistory(type,product,zone);
	},
	
	COLNAMES : ['pricehistory.instanceType','pricehistory.productDescription','pricehistory.spotPrice','pricehistory.timestamp',
				'pricehistory.availabilityZone'],
    treeBox : null,
    selection : null,
    arrLocalFiles : new Array(),
    pricehistoryList : new Array(),
    registered : false,

    get rowCount() { return this.pricehistoryList.length; },

    setTree      : function(treeBox)            { this.treeBox = treeBox; },
    getCellText : function(idx, column) {
        if (idx >= this.rowCount) return "";
        var member = column.id.split(".").pop();
        return this.pricehistoryList[idx][member];
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
        this.pricehistoryList);
    },

    sort : function() {
        sortView(document, this.COLNAMES, this.pricehistoryList);
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
            ec2ui_model.registerInterest(this, 'pricehistory');
        }
    },

    invalidate: function() {
        this.displayPriceHistory(ec2ui_session.model.pricehistory);
    },

    refresh: function() {
        this.zonelist();
		this.selectedMetric();
    },

    notifyModelChanged: function(interest) {
        this.invalidate();
    },

    displayPriceHistory : function (pricehistoryList) {
        if (!pricehistoryList) { pricehistoryList = []; }

        this.treeBox.rowCountChanged(0, -this.pricehistoryList.length);
        this.pricehistoryList = pricehistoryList;
        this.treeBox.rowCountChanged(0, this.pricehistoryList.length);
        this.sort();
        this.selection.clearSelection();
        if (pricehistoryList.length > 0) {
            this.selection.select(0);
        }
    }
};

ec2ui_PriceHistoryTreeView.register();