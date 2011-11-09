var ec2_CloudFormation_Stack = 
{
   ec2ui_session : null,
   retVal : null,
   cloudForm : null,
   stackList : null,
   jsonList : null,
   urlList : null,
   JSONObject : null,
   jsonHttp : null,
   
   createstack : function() {
	this.retVal.ok = true;
        return true;
   },
   
   init : function() {
      this.ec2ui_session = window.arguments[1];
      this.retVal = window.arguments[2];
      this.cloudForm = window.arguments[3];
      this.stackList = window.arguments[4];
      this.jsonList = window.arguments[5];
      this.urlList = window.arguments[6];
   },
   
   readFinalParams : function() {
  
      var noOFParams = 0;
      var parms = "{";
      
      var myList = document.getElementById('cfTemplates');
      parms  = parms + "StackName:";
      parms  = parms + "'"+document.getElementById("stackName").value+"',";
   
      parms  = parms + "StackUrl:";
      parms  = parms + "'"+this.urlList[myList.value]+"',"; 
      var i = 0;
      
      for(var fld in JSONObject.Parameters)
      { 
         var txt="";
         var tb = "tb"+i;
         parms  = parms + fld.toString() +":";
         if(i != noOFParams-1)
         parms  = parms + "'"+document.getElementById(tb.toString()).value+"',";
         else
         parms  = parms + "'"+document.getElementById(tb.toString()).value+"'";
         
         i = i + 1; 
      }
      parms  = parms + "}";
     
      this.retVal.arrayParams = parms;
      this.retVal.ok = true;
      this.createstack();
      return true;
   },

   readParms : function() {
      var myList = document.getElementById('paramsInfo');
      while(myList.itemCount)
      {
         myList.removeItemAt(0);
      }
      var i=0;
      
      for(var fld in JSONObject.Parameters)
      {
         if(JSONObject.Parameters[fld.toString()].NoEcho) {
            i = i + 1;
            continue;
         }
         
         var txt="";
         var tb = "tb"+i;
         txt += fld.toString()+" : ";
         txt += document.getElementById(tb.toString()).value;
         
         myList.insertItemAt(i, txt);
         i = i + 1;
      }
   },

   getResource : function() {

      var myList = document.getElementById('cfTemplates');
      var myJSONtext = this.jsonList[myList.value];
 
      JSONObject = eval('('+myJSONtext+')');
     
      var myList = document.getElementById('resInfo');
      while(myList.itemCount)
      {
         myList.removeItemAt(0);
      }
      
      var i = 0;
      for(var fld in JSONObject.Resources)
      {
         var txt="";
         txt += fld.toString()+"  :  ";
         txt += JSONObject.Resources[fld.toString()].Type;
         myList.insertItemAt(i, txt);
         i = i + 1;
      }
   },
   
   loadParms : function(action) {

      if(action=='getResource')
      {
         this.getResource();
      } else {
         this.HideAllControll();
         this.readXML();
      }
   },
   
   readXML : function() {

      var JSONObject;
      var myList = document.getElementById('cfTemplates');
      var myJSONtext = this.jsonList[myList.value];
      JSONObject = eval('('+myJSONtext+')');
      var i=0;
      var pj=1;
      for(var fld in JSONObject.Parameters)
      {
         var rTxt = "row"+i;
         var rDes = "des"+i;
         document.getElementById(rTxt.toString()).setAttribute("hidden", "false");
         document.getElementById(rDes.toString()).setAttribute("hidden", "false");
         
         var lab = "lab"+i;
         var tb = "tb"+i;
         var des = "des"+i;
         document.getElementById(lab.toString()).setAttribute("style", "font-weight:bold");
         
         document.getElementById(lab.toString()).value = fld.toString();
         if(JSONObject.Parameters[fld.toString()].Default)
            document.getElementById(tb.toString()).value = JSONObject.Parameters[fld.toString()].Default;
         if(JSONObject.Parameters[fld.toString()].Description)
            document.getElementById(des.toString()).value = JSONObject.Parameters[fld.toString()].Description;
         if(JSONObject.Parameters[fld.toString()].NoEcho)
            document.getElementById(tb.toString()).setAttribute("type", "password");
         
         i = i + 1;
      }
   },
   
   checkStack : function(t) {
      
      document.getElementById('theWizard').canAdvance = (document.getElementById('stackName').value != "");
      
      if(!t)
      return;
      if(t.value.match(/\s/g)) {
         alert('Sorry, you are not allowed to enter any spaces');
         t.value=t.value.replace(/\s/g,'');
      }
   },
   
   loadList : function() {
     
      this.init();
      var myList = document.getElementById('cfTemplates');
      var i = 0;
      for each(var tam in this.stackList)
      {
         myList.insertItemAt(myList.count,tam.toString(), i);
         i = i + 1;
      }
   },
 
   readList : function() {
      var listTmplate;
      var count = listTmplate.documentElement.childNodes.length;
      for (var i = 0; i != count; i=i+1) {
         i=i+1;
         var name = listTmplate.documentElement.childNodes[i].textContent;
         var myList = document.getElementById('cfTemplates');
         myList.insertItemAt(myList.count, name, name);
      }
   },
   
   HideAllControll : function () {
      var i=0;
      for(i; i != 20 ; i = i+1)
      {
         var rTxt = "row"+i;
         var rDes = "des"+i;
         var tb = "tb"+i;
         document.getElementById(rTxt.toString()).setAttribute("hidden", "true");
         document.getElementById(rDes.toString()).setAttribute("hidden", "true");
         document.getElementById(tb.toString()).setAttribute("type", "text");
      }
   }    
}

