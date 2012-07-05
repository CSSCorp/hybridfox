var ec2ui_SnapshotTreeView = {
    COLNAMES: ['snap.id', 'snap.volumeId', 'snap.volumeSize', 'snap.status', 'snap.startTime',
              'snap.progress','snap.publictag', 'snap.tag'],
    imageIdRegex : new RegExp("^snap-"),

    getSearchText : function() {
        return document.getElementById('ec2ui.snapshots.search').value;
    },

    refresh : function() {
        ec2ui_session.showBusyCursor(true);
        ec2ui_session.controller.describeSnapshots();
        ec2ui_session.showBusyCursor(false);
    },

    invalidate : function() {
        var target = ec2ui_SnapshotTreeView;
        target.displayImages(target.filterImages(ec2ui_model.snapshots));
    },

    searchChanged : function(event) {
        if (this.searchTimer) {
            clearTimeout(this.searchTimer);
        }

        this.searchTimer = setTimeout(this.invalidate, 500);
    },

    register : function() {
        if (!this.registered) {
            this.registered = true;
            ec2ui_model.registerInterest(this, 'snapshots');
        }
    },

    viewDetails : function(event) {
        var image = this.getSelectedImage();
        if (image == null) return;
        window.openDialog("chrome://ec2ui/content/dialog_snapshot_details.xul", null, "chrome,centerscreen,modal", image);
    },

    deleteSnapshot : function () {
        var image = this.getSelectedImage();
        if (image == null) return;
        var confirmed = confirm(ec2ui_utils.getMessageProperty("ec2ui.msg.snapshotsview.confirm.deleteSnapshot", [image.id]));
        if (!confirmed)
            return;
        var me = this;
        var wrap = function(list) {
            if (ec2ui_prefs.isRefreshOnChangeEnabled()) {
                me.refresh();
            }
        }

        ec2ui_session.controller.deleteSnapshot(image.id, wrap);
    },
    
    createtag : function(){
        var image = this.getSelectedImage();
        if (image == null) return;
        var tagging = null;
        var awstag = prompt('Tag your instance ('+ image.id +') with eg: key:value,key2:value2',tagging);
        var wrap = function() {
            if (ec2ui_prefs.isRefreshOnChangeEnabled()) {
                me.refresh();
            }
        }
        var tags = awstag.split(",");
        for(i = 0; i < tags.length; i++){
            var keyval = tags[i].split(":");
            var key = keyval[0];
            var value = keyval[1];
            ec2ui_session.controller.createEC2Tag(image.id, key, value);
        }
        wrap();
    },
    
    deletetag : function(){
        var image = this.getSelectedImage();
        if (image == null) return;
        var me = this;
        var wrap = function() {
            if (ec2ui_prefs.isRefreshOnChangeEnabled()) {
                me.refresh();
            }
        }
        ec2ui_session.deleteEC2Tag(image);
        wrap();
    }, 

    createVolume : function () {
        var image = this.getSelectedImage();
        if (image == null) return;
        ec2ui_VolumeTreeView.createVolume(image);
    },

    displayImages : function (imageList) {
        BaseImagesView.displayImages.call(this, imageList);

        if (ec2ui_prefs.isRefreshOnChangeEnabled()) {
            // Determine if there are any pending operations
            if (this.pendingUpdates()) {
                this.startRefreshTimer("ec2ui_SnapshotTreeView",
                                       this.refresh);
            } else {
                this.stopRefreshTimer("ec2ui_SnapshotTreeView");
            }
        } else {
            this.stopRefreshTimer("ec2ui_SnapshotTreeView");
        }
    },

    pendingUpdates : function() {
        // Walk the list of snapshots to see whether there is a volume
        // whose state needs to be refreshed
        var snaps = ec2ui_session.model.snapshots;
        var fPending = false;

        if (snaps == null) {
            return fPending;
        }

        for (var i in snaps) {
            if (snaps[i].status == "completed") {
                continue;
            }
            fPending = true;
            break;
        }

        return fPending;
    },
};

// poor-man's inheritance
ec2ui_SnapshotTreeView.__proto__ = BaseImagesView;

ec2ui_SnapshotTreeView.register();
