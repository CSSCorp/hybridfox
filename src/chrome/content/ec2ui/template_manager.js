var ec2ui_templateManager = {
    templatemap : null,

    initDialog : function() {
        this.templatemap = window.arguments[0];

        document.getElementById("ec2ui.templates.view").view = ec2ui_templatesTreeView;
        ec2ui_templatesTreeView.setMapping(this.templatemap);
    
    },

    indexOfTemplateName : function(name) {
        var templatelist = this.templatemap.toArray(function(k,v){return v});

        for (var i = 0; i < templatelist.length; i++) {
            if (templatelist[i].name == name) {
                return i;
            }
        }
        return -1;
    },

    removeTemplate : function() {
        var name = document.getElementById("ec2ui.templates.name").value;
        if (name == null || name == "") return;

        this.templatemap.removeKey(name);
        ec2ui_templatesTreeView.setMapping(this.templatemap);
    },

    saveTemplate : function() {
        var name = document.getElementById("ec2ui.templates.name").value.trim() || "";
        var url = document.getElementById("ec2ui.templates.url").value.trim() || "";
        if (name.length == 0) return;
        if (url.length == 0) return;

        this.templatemap.put(name, new Template(name, url));
        ec2ui_templatesTreeView.setMapping(this.templatemap);
    },

    selectMapping : function() {
        var sel = ec2ui_templatesTreeView.getSelectedTemplate();
        if (sel != null) {
            document.getElementById("ec2ui.templates.name").value = sel.name;
		    document.getElementById("ec2ui.templates.url").value = sel.url;
        }
    }
}
