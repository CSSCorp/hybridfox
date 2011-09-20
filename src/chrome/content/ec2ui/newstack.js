var ec2_CloudFormation_Stack = 
{
   ec2ui_session : null,
   retVal : null,
   cloudForm : null,
   stackList : null,
   jsonList : null,
   urlList : null,
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
    }
}

