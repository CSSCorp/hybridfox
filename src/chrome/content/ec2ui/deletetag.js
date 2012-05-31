var ec2ui_deletetag = {
    ec2ui_session : null,
    retVal : null,
    resource : null,
    
    launch : function(){
        this.retVal.resourceid = document.getElementById("ec2ui.deletetag.resourceid").value.trim();
	var listBox = document.getElementById('list_delete_tag');
	var idx = 0;
	var nRowCount = listBox.getRowCount();
	this.retVal.deletekey = "";
	for(idx=0;idx < nRowCount;idx++)
	{
	    var cellID = "cellcheck"+idx;

	    var cell = document.getElementById(cellID);

	    if(cell.hasAttribute('checked','true'))
	    {
		var cellkey = "key"+idx;

		var keyid = document.getElementById(cellkey);

		var key = keyid.getAttribute('label');
		
		this.retVal.deletekey =  this.retVal.deletekey + key +",";
	    }
	}
	this.retVal.ok = true;
        return true;
    },
    
    init : function() {
        this.ec2ui_session = window.arguments[0];
        this.resource = window.arguments[1];
	this.retVal = window.arguments[2];
        var resource = window.arguments[1];
        var taglist = new String(resource.publictag);
        var tags = taglist.split(",");
        document.getElementById("ec2ui.deletetag.resourceid").value = resource.id;        
        var Idx = 0;
        var Tagrow = document.getElementById('list_delete_tag');
        
        for(i = 0; i < tags.length; i++){
            var keyval = tags[i].split(":");
            var key = keyval[0];
            var value = keyval[1];
            var row = document.createElement('listitem');
	    var cell1 = document.createElement('listcell');
	    var cell2 = document.createElement('listcell');
	    var cell3 = document.createElement('listcell');
            
            var cellID = "cellcheck"+Idx;
	
	    var cellkey = "key"+Idx;
            
            cell1.setAttribute('type', 'checkbox');
	    cell1.setAttribute('id',cellID);
	    row.appendChild(cell1);
	
	    cell2.setAttribute('label', key);
	    cell2.setAttribute('id',cellkey);
	    row.appendChild(cell2);
	
	    cell3.setAttribute('label', value);
	    row.appendChild(cell3);
            
            var rowID = "row"+Idx;
	    row.setAttribute('id',rowID);
            
            Tagrow.appendChild(row);
            
            Idx = Idx +1;
        }
    },
    
    checkdecheck : function(){
        var listBox = document.getElementById('list_delete_tag');
        var selectedItem = listBox.currentIndex;
        if (selectedItem == -1) return null;
        var rowID = "row"+selectedItem;
        var row = document.getElementById(rowID);
        var cellID = "cellcheck"+selectedItem;
        var cell = document.getElementById(cellID);
        var attribute = cell.getAttribute('type');
        if(cell.hasAttribute('checked','true'))
        {
           cell.setAttribute('checked','false');
           cell.removeAttribute('checked');      
        }else{
	   cell.setAttribute('checked','true');
	}
        
    }
}