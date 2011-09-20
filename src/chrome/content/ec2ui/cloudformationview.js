var listOfTemp = {
    
    DrupalTemp :{
        Name:'Drupal-1.0.0',
        Url:'https://s3.amazonaws.com/cloudformation-samples-us-east-1/Drupal-1.0.0.template'
    },
    DrupalNoTemp :{
        Name:'Drupal-NoSSH-1.0.0',
        Url:'https://s3.amazonaws.com/cloudformation-samples-us-east-1/Drupal-NoSSH-1.0.0.template'
    },
    ElasticTemp:{
        Name:'ElasticBeanstalk-1.0.0',
        Url:'https://s3.amazonaws.com/cloudformation-samples-us-east-1/ElasticBeanstalk-1.0.0.template'
    },
    
    GollumTemp:{
        Name:'Gollum-1.0.0',
        Url:'https://s3.amazonaws.com/cloudformation-samples-us-east-1/Gollum-1.0.0.template'
    },

    InsoshiTemp:{
        Name:'Insoshi-1.0.0',
        Url:'https://s3.amazonaws.com/cloudformation-samples-us-east-1/Insoshi-1.0.0.template'
    },

    JoomlaTemp:{
        Name:'Joomla-1.0.0',
        Url:'https://s3.amazonaws.com/cloudformation-samples-us-east-1/Joomla-1.0.0.template'
    },

    PHPTemp:{
        Name:'PHPHelloWorld-1.0.0',
        Url:'https://s3.amazonaws.com/cloudformation-samples-us-east-1/PHPHelloWorld-1.0.0.template'
    },

    RedTemp:{
        Name:'Redmine-1.0.0',
        Url:'https://s3.amazonaws.com/cloudformation-samples-us-east-1/Redmine-1.0.0.template'
    },

    WordPressTemp:{
        Name:'WordPress-1.0.0',
        Url:'https://s3.amazonaws.com/cloudformation-samples-us-east-1/WordPress-1.0.0.template'
    }

};

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

    refresh: function() {
        ec2ui_session.controller.describeStack();
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
    
    createstack:function(){
        var arrayParams ;
        
        var retVal = {ok:null,arrayParams:null};
        var sampleList = new Array(listOfTemp.length);
        var sampleJSON = new Array(listOfTemp.length);
        var urlList = new Array(listOfTemp.length);
        var i = 0;
        for each(var temp in listOfTemp)
        {
            sampleList[i]= temp.Name.toString();
            sampleJSON[i]= this.getCFStack(temp.Url.toString());
            urlList[i] = temp.Url.toString();
            i = i + 1;          
        }
        window.openDialog("chrome://ec2ui/content/dialog_create_stack.xul",
                          null,
                          "chrome,centerscreen,modal",
                          null,
                          ec2ui_session,
                          retVal,
                          this,
                          sampleList,
                          sampleJSON,
                          urlList
                        );
        var me = this;
        var wrap = function() {
            if (ec2ui_prefs.isRefreshOnChangeEnabled()) {
                me.refresh();
            }            
        }
        
        ec2ui_session.controller.CreateStack(retVal.arrayParams, wrap);
    },
    
    deletestack : function(event){
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
        if (cloudformationList.length > 0) {
            this.selection.select(0);
        }
    },
    
    getCFStack: function (url) {
        var httpRsp;
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
