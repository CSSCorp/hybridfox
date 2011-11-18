var ec2_CloudFormation_Stack = 
{
   ec2ui_session : null,
   retVal : null,
   templatemap : null,
   JSONObject : null,
   
   createstack : function() {
	this.retVal.ok = true;
        return true;
   },
   
   init : function() {
      this.ec2ui_session = window.arguments[0];
      this.retVal = window.arguments[1];
      this.templatemap = window.arguments[2];
   },
   
   readFinalParams : function() {
  
      var noOFParams = 0;
      var parms = "{";
      
      var stackurl = document.getElementById("templates.list");
      var url = stackurl.getAttribute("value");
      
      parms  = parms + "StackName:";
      parms  = parms + "'"+document.getElementById("stackName").value+"',";
   
      parms  = parms + "StackUrl:";
      parms  = parms + "'"+url+"',"; 
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

   getResource : function(doc) {
 
      JSONObject = eval('('+doc+')');
     
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
   
   loadParms : function(doc) {
      this.readXML(doc);
   },
   
   readXML : function(doc) {

      JSONObject = eval('('+doc+')');
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
   
   selectedtemplate : function() {

      var templateurl = document.getElementById("templates.list");
      var url = templateurl.getAttribute("value");
      var name = templateurl.getAttribute("label");
      this.getCFStack(url);
   },
   
   loadtemplates : function() {
      
      this.init();
      var activeTemplatesMenu = document.getElementById("templates.list");
      activeTemplatesMenu.removeAllItems();
      
      var templatelist = this.templatemap.toArray(function(k,v){return new Template(k, v.url)});
      for(var i in templatelist) {
         activeTemplatesMenu.insertItemAt(i,
                                          templatelist[i].name,
                                          templatelist[i].url
                                          );
      }
   },
   
   getCFStack: function (url) {
      var httpRsp;
      var httpRsp = this.ec2ui_session.client.makeCFStackHTTPRequest("GET",url);
      if (!httpRsp.hasErrors) {
         var xmlhttp = httpRsp.xmlhttp;
         if (xmlhttp) {
            var doc = xmlhttp.responseText;
            this.getResource(doc);
            this.HideAllControll();
            this.loadParms(doc);
         }
      }
      return null;
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

