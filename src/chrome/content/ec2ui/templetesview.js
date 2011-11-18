var ec2ui_templatesTreeView = {
    COLNAMES: ['template.name','template.url'],
    treeBox: null,
    selection: null,
    templatelist : new Array(),

    get rowCount()                     { return this.templatelist.length; },
    setTree     : function(treeBox)    { this.treeBox = treeBox; },
    getCellText : function(idx, column) {
        if (idx >= this.rowCount) return "";
        var member = column.id.split(".").pop();
        return this.templatelist[idx][member];
    },
    isEditable: function(idx, column)  { return true; },
    isContainer: function(idx)         { return false;},
    isSeparator: function(idx)         { return false; },
    isSorted: function()               { return false; },
    getImageSrc: function(idx, column) { return "" ; },
    getProgressMode : function(idx,column) {},
    getCellValue: function(idx, column) {},
    cycleHeader: function(col) {
        cycleHeader(
            col,
            document,
            this.COLNAMES,
            this.templatelist);
        this.treeBox.invalidate();
    },
    selectionChanged: function() {},
    cycleCell: function(idx, column) {},
    performAction: function(action) {},
    performActionOnCell: function(action, index, column) {},
    getRowProperties: function(idx, column, prop) {},
    getCellProperties: function(idx, column, prop) {},
    getColumnProperties: function(column, element, prop) {},
    getLevel : function(idx) { return 0; },

    setMapping : function(mapping) {
        this.treeBox.rowCountChanged(0, -this.templatelist.length);
        // Unpack the map into an array for display purposes
        this.templatelist = mapping.toArray(function(k,v){return new Template(k, v.url)});
        this.treeBox.rowCountChanged(0, this.templatelist.length);
        sortView(document, this.COLNAMES, this.templatelist);
    },

    selectTemplateName: function(index) {
        this.selection.select(index);
    },

    getSelectedTemplate : function() {
        var index =  this.selection.currentIndex;
        if (index == -1) return null;
        return this.templatelist[index];
    }
};
