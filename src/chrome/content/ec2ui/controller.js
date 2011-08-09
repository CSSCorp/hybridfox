// controller: slightly higher level of abstraction over the EC2 API
var ec2ui_controller = {
    getNsResolver : function() {
        return ec2_httpclient.getNsResolver();
    },

    registerImageInRegion : function(manifestPath, region, callback) {
        region = region.toLowerCase();

        // Determine the current region
        var activeReg = ec2ui_utils.determineRegionFromString(ec2ui_session.getActiveEndpoint().name);
		
        log(activeReg + ": active, requested: " + region);

        if (activeReg == region) {
            // The image's region is the same as the active region
            this.registerImage(manifestPath, callback);
        } else {
            ec2_httpclient.queryEC2InRegion(region,
                                            "RegisterImage",
                                            [["ImageLocation", manifestPath]],
                                            this,
                                            true,
                                            "onCompleteRegisterImage",
                                            callback);
        }
    },

    registerImage : function (manifestPath, callback) {
        ec2_httpclient.queryEC2("RegisterImage", [["ImageLocation", manifestPath]], this, true, "onCompleteRegisterImage", callback);
    },

    onCompleteRegisterImage : function (objResponse) {
        var xmlDoc = objResponse.xmlDoc;
        var imageId = getNodeValueByName(xmlDoc, "imageId");

        if (objResponse.callback)
            objResponse.callback(imageId);
    },

    deregisterImage : function (imageId, callback) {
        ec2_httpclient.queryEC2("DeregisterImage", [["ImageId", imageId]], this, true, "onCompleteDeregisterImage", callback);
    },

    onCompleteDeregisterImage : function (objResponse) {
        if (objResponse.callback)
            objResponse.callback();
    },

    createSnapshot : function (volumeId, callback) {
        ec2_httpclient.queryEC2("CreateSnapshot", [["VolumeId", volumeId]], this, true, "onCompleteCreateSnapshot", callback);
    },

    onCompleteCreateSnapshot: function (objResponse) {
        var xmlDoc = objResponse.xmlDoc;
        var id = getNodeValueByName(xmlDoc, "snapshotId");

        if (objResponse.callback)
            objResponse.callback(id);
    },

    attachVolume: function (volumeId, instanceId, device, callback) {
        var params = []
        if (volumeId != null) params.push(["VolumeId", volumeId]);
        if (instanceId != null) params.push(["InstanceId", instanceId]);
        if (device != null) params.push(["Device", device]);
        ec2_httpclient.queryEC2("AttachVolume", params, this, true, "onCompleteAttachVolume", callback);
    },

    onCompleteAttachVolume: function (objResponse) {
        if (objResponse.callback)
            objResponse.callback();
    },

    createVolume : function (size, snapshotId, zone, callback) {
        var params = []
        if (size != null) params.push(["Size", size]);
        if (snapshotId != null) params.push(["SnapshotId", snapshotId]);
        if (zone != null) params.push(["AvailabilityZone", zone]);
        ec2_httpclient.queryEC2("CreateVolume", params, this, true, "onCompleteCreateVolume", callback);
    },

    onCompleteCreateVolume: function (objResponse) {
        var xmlDoc = objResponse.xmlDoc;
        var id = getNodeValueByName(xmlDoc, "volumeId");
        if (objResponse.callback)
            objResponse.callback(id);
    },

    deleteSnapshot : function (snapshotId, callback) {
        ec2_httpclient.queryEC2("DeleteSnapshot", [["SnapshotId", snapshotId]], this, true, "onCompleteDeleteSnapshot", callback);
    },

    onCompleteDeleteSnapshot: function (objResponse) {
        ec2ui_SnapshotTreeView.refresh();
        if (objResponse.callback)
            objResponse.callback();
    },

    deleteVolume : function (volumeId, callback) {
        ec2_httpclient.queryEC2("DeleteVolume", [["VolumeId", volumeId]], this, true, "onCompleteDeleteVolume", callback);
    },

    onCompleteDeleteVolume: function (objResponse) {
        if (objResponse.callback)
            objResponse.callback();
    },

    detachVolume : function (volumeId, callback) {
        ec2_httpclient.queryEC2("DetachVolume", [["VolumeId", volumeId]], this, true, "onCompleteDetachVolume", callback);
    },

    forceDetachVolume : function (volumeId, callback) {
        ec2_httpclient.queryEC2("DetachVolume", [["VolumeId", volumeId], ["Force", true]], this, true, "onCompleteDetachVolume", callback);
    },

    onCompleteDetachVolume: function (objResponse) {
        if (objResponse.callback)
            objResponse.callback();
    },

    describeVolumes : function (callback) {
        ec2_httpclient.queryEC2("DescribeVolumes", [], this, true, "onCompleteDescribeVolumes", callback);
    },

    onCompleteDescribeVolumes : function (objResponse) {
        var xmlDoc = objResponse.xmlDoc;

        var list = new Array();
        var items = xmlDoc.evaluate("/ec2:DescribeVolumesResponse/ec2:volumeSet/ec2:item",
                                    xmlDoc,
                                    this.getNsResolver(),
                                    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                                    null);
        for(var i=0 ; i < items.snapshotLength; i++) {
            var id = getNodeValueByName(items.snapshotItem(i), "volumeId");
            var size = getNodeValueByName(items.snapshotItem(i), "size");
            var snapshotId = getNodeValueByName(items.snapshotItem(i), "snapshotId");

            var zone = getNodeValueByName(items.snapshotItem(i), "availabilityZone");
            var status = getNodeValueByName(items.snapshotItem(i), "status");
            var createTime = new Date();
            createTime.setISO8601(getNodeValueByName(items.snapshotItem(i), "createTime"));

            // Zero out the values for attachment
            var instanceId = "";
            var device = "";
            var attachStatus = "";
             var attachTime = new Date();
	    
	    var attachementset = items.snapshotItem(i).getElementsByTagName("attachmentSet");      
                for (var k = 0; k < attachementset.length; k++)
                {
                  var instanceId = getNodeValueByName(attachementset[k], "instanceId");
                  var device = getNodeValueByName(attachementset[k], "device");
                  var attachStatus = getNodeValueByName(attachementset[k], "status");
		  if (attachStatus) {
                      attachTime.setISO8601(getNodeValueByName(attachementset[k], "attachTime"));
                  }
                }
            // Make sure there is an attachment
	
	   
            list.push(new Volume(id, size, snapshotId, zone, status, createTime, instanceId, device, attachStatus, attachTime || ""));
        }

        this.addResourceTags(list, ec2ui_session.model.resourceMap.volumes, "id");
        ec2ui_model.updateVolumes(list);
        if (objResponse.callback)
            objResponse.callback(list);
    },

    describeSnapshots : function (callback) {
        ec2_httpclient.queryEC2("DescribeSnapshots", [], this, true, "onCompleteDescribeSnapshots", callback);
    },

    onCompleteDescribeSnapshots: function (objResponse) {
        var xmlDoc = objResponse.xmlDoc;

        var list = new Array();
        var items = xmlDoc.evaluate("/ec2:DescribeSnapshotsResponse/ec2:snapshotSet/ec2:item",
                                    xmlDoc,
                                    this.getNsResolver(),
                                    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                                    null);
        for(var i=0 ; i < items.snapshotLength; i++) {
            var id = getNodeValueByName(items.snapshotItem(i), "snapshotId");
            var volumeId = getNodeValueByName(items.snapshotItem(i), "volumeId");
            var status = getNodeValueByName(items.snapshotItem(i), "status");
            var startTime = new Date();
            startTime.setISO8601(getNodeValueByName(items.snapshotItem(i), "startTime"));
            var progress = getNodeValueByName(items.snapshotItem(i), "progress");
            list.push(new Snapshot(id, volumeId, status, startTime, progress));
        }

        this.addResourceTags(list, ec2ui_session.model.resourceMap.snapshots, "id");
        ec2ui_model.updateSnapshots(list);
        if (objResponse.callback)
            objResponse.callback(list);
    },

    describeImage : function (imageId, callback) {
        ec2_httpclient.queryEC2("DescribeImages", [["ImageId", imageId]], this, true, "onCompleteDescribeImage", callback);
    },

    onCompleteDescribeImage: function (objResponse) {
        var xmlDoc = objResponse.xmlDoc;

        var items = xmlDoc.evaluate("/ec2:DescribeImagesResponse/ec2:imagesSet/ec2:item",
                                    xmlDoc,
                                    this.getNsResolver(),
                                    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                                    null);
        var item = items.snapshotItem(0);
        var ami = null;

        if (item) {
            var imageId = getNodeValueByName(item, "imageId");
            var imageLocation = getNodeValueByName(item, "imageLocation");
            var imageState = getNodeValueByName(item, "imageState");
            var owner = getNodeValueByName(item, "imageOwnerId");
            var isPublic = getNodeValueByName(item, "isPublic");

            // This value might not exist, but getNodeValueByName
            // returns "" in case the element is not defined.
            var platform = getNodeValueByName(item, "platform");

            ami = new AMI(imageId, imageLocation, imageState, owner, (isPublic == 'true' ? 'public' : 'private'), platform);
        }

        ec2ui_model.addToAmiManifestMap(ami);
        if (objResponse.callback && ami)
            objResponse.callback(ami);
    },

    describeImages : function (isSync, callback) {
        if (!isSync) isSync = false;
        ec2_httpclient.queryEC2("DescribeImages", [], this, isSync, "onCompleteDescribeImages", callback);
    },

    onCompleteDescribeImages : function (objResponse) {
        var xmlDoc = objResponse.xmlDoc;

        var list = new Array();
        var img = null;
        var items = xmlDoc.evaluate("/ec2:DescribeImagesResponse/ec2:imagesSet/ec2:item",
                                    xmlDoc,
                                    this.getNsResolver(),
                                    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                                    null);
        for(var i=0 ; i < items.snapshotLength; i++) {
            var imageId = getNodeValueByName(items.snapshotItem(i), "imageId");
            var imageLocation = getNodeValueByName(items.snapshotItem(i), "imageLocation");
            var imageState = getNodeValueByName(items.snapshotItem(i), "imageState");
            var owner = getNodeValueByName(items.snapshotItem(i), "imageOwnerId");
            var isPublic = getNodeValueByName(items.snapshotItem(i), "isPublic");
            var arch = getNodeValueByName(items.snapshotItem(i), "architecture");
            var rootDeviceType = getNodeValueByName(items.snapshotItem(i), "rootDeviceType");
            // These value might not exist, but getNodeValueByName
            // returns "" in case the element is not defined.
            var platform = getNodeValueByName(items.snapshotItem(i), "platform");
            var aki = getNodeValueByName(items.snapshotItem(i), "kernelId");
            var ari = getNodeValueByName(items.snapshotItem(i), "ramdiskId");

            list.push(new AMI(imageId,
                          imageLocation,
                          imageState,
                          owner,
                          (isPublic == 'true' ? 'public' : 'private'),
                          arch,
			  rootDeviceType,
                          platform,
                          aki,
                          ari));
        }

        this.addResourceTags(list, ec2ui_session.model.resourceMap.images, "id");
        ec2ui_model.updateImages(list);
        if (objResponse.callback)
            objResponse.callback(list);
    },

    describeLeaseOfferings : function (callback) {
        ec2_httpclient.queryEC2("DescribeReservedInstancesOfferings", [], this, true, "onCompleteDescribeLeaseOfferings", callback);
    },

    onCompleteDescribeLeaseOfferings : function (objResponse) {
        var xmlDoc = objResponse.xmlDoc;

        var list = new Array();
        var img = null;
        var items = xmlDoc.evaluate("/ec2:DescribeReservedInstancesOfferingsResponse/ec2:reservedInstancesOfferingsSet/ec2:item",
                                    xmlDoc,
                                    this.getNsResolver(),
                                    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                                    null);
        for(var i=0 ; i < items.snapshotLength; i++) {
            var id = getNodeValueByName(items.snapshotItem(i), "reservedInstancesOfferingId");
            var type = getNodeValueByName(items.snapshotItem(i), "instanceType");
            var az = getNodeValueByName(items.snapshotItem(i), "availabilityZone");
            var duration = secondsToYears(getNodeValueByName(items.snapshotItem(i), "duration"));
            var fPrice = parseInt(getNodeValueByName(items.snapshotItem(i), "fixedPrice")).toString();
            var uPrice = getNodeValueByName(items.snapshotItem(i), "usagePrice");
            var desc = getNodeValueByName(items.snapshotItem(i), "productDescription");

            list.push(new LeaseOffering(id,
                                        type,
                                        az,
                                        duration,
                                        fPrice,
                                        uPrice,
                                        desc));
        }

        ec2ui_model.updateLeaseOfferings(list);
        if (objResponse.callback)
            objResponse.callback(list);
    },

    describeReservedInstances : function (callback) {
        ec2_httpclient.queryEC2("DescribeReservedInstances", [], this, true, "onCompleteDescribeReservedInstances", callback);
    },

    onCompleteDescribeReservedInstances : function (objResponse) {
        var xmlDoc = objResponse.xmlDoc;

        var list = new Array();
        var img = null;
        var items = xmlDoc.evaluate("/ec2:DescribeReservedInstancesResponse/ec2:reservedInstancesSet/ec2:item",
                                    xmlDoc,
                                    this.getNsResolver(),
                                    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                                    null);
        for(var i=0 ; i < items.snapshotLength; i++) {
            var item = items.snapshotItem(i);
            var id = getNodeValueByName(item, "reservedInstancesId");
            var type = getNodeValueByName(item, "instanceType");
            var az = getNodeValueByName(item, "availabilityZone");
            var start = new Date();
            start.setISO8601(getNodeValueByName(item, "start"));
            var duration = secondsToYears(getNodeValueByName(item, "duration"));
            var fPrice = parseInt(getNodeValueByName(item, "fixedPrice")).toString();
            var uPrice = getNodeValueByName(item, "usagePrice");
            var count = getNodeValueByName(item, "instanceCount");
            var desc = getNodeValueByName(item, "productDescription");
            var state = getNodeValueByName(item, "state");

            list.push(new ReservedInstance(id,
                                           type,
                                           az,
                                           start,
                                           duration,
                                           fPrice,
                                           uPrice,
                                           count,
                                           desc,
                                           state));
        }

        ec2ui_model.updateReservedInstances(list);
        if (objResponse.callback)
            objResponse.callback(list);
    },

    purchaseOffering : function (id, count, callback) {
        ec2_httpclient.queryEC2("PurchaseReservedInstancesOffering",
                                [["ReservedInstancesOfferingId", id], ["InstanceCount", count]],
                                this,
                                true,
                                "onCompletePurchaseOffering",
                                callback);
    },

    onCompletePurchaseOffering : function (objResponse) {
        var xmlDoc = objResponse.xmlDoc;
        var id = getNodeValueByName(xmlDoc, "reservedInstancesId");

        if (objResponse.callback)
            objResponse.callback(id);
    },

    describeLaunchPermissions : function (imageId, callback) {
        ec2_httpclient.queryEC2("DescribeImageAttribute", [["ImageId", imageId], ["Attribute","launchPermission"]], this, true, "onCompleteDescribeLaunchPermissions", callback);
    },

    onCompleteDescribeLaunchPermissions : function (objResponse) {
        var xmlDoc = objResponse.xmlDoc;

        var list = new Array();
        var items = xmlDoc.getElementsByTagName("item");
        for (var i = 0; i < items.length; i++) {
            if (items[i].getElementsByTagName("group")[0]) {
                list.push(getNodeValueByName(items[i], "group"));
            }
            if (items[i].getElementsByTagName("userId")[0]) {
                list.push(getNodeValueByName(items[i], "userId"));
            }
        }

        if (objResponse.callback)
            objResponse.callback(list);
    },

    addLaunchPermission : function (imageId, name, callback) {
        var params = []
        params.push(["ImageId", imageId]);
        params.push(["Attribute","launchPermission"]);
        params.push(["OperationType", "add"]);
        if (name == "all") {
            params.push(["UserGroup.1", name]);
        } else {
            params.push(["UserId.1", name]);
        }
        ec2_httpclient.queryEC2("ModifyImageAttribute", params, this, true, "onCompleteModifyImageAttribute", callback);
    },

    revokeLaunchPermission : function (imageId, name, callback) {
        var params = []
        params.push(["ImageId", imageId]);
        params.push(["Attribute","launchPermission"]);
        params.push(["OperationType", "remove"]);
        if (name == "all") {
            params.push(["UserGroup.1", name]);
        } else {
            params.push(["UserId.1", name]);
        }
        ec2_httpclient.queryEC2("ModifyImageAttribute", params, this, true, "onCompleteModifyImageAttribute", callback);
    },

    onCompleteModifyImageAttribute : function (objResponse) {
        if (objResponse.callback)
            objResponse.callback();
    },

    resetLaunchPermissions : function (imageId, callback) {
        var params = []
        params.push(["ImageId", imageId]);
        params.push(["Attribute","launchPermission"]);
        ec2_httpclient.queryEC2("ResetImageAttribute", params, this, true, "onCompleteResetImageAttribute", callback);
    },

    onCompleteResetImageAttribute : function (objResponse) {
        if (objResponse.callback)
            objResponse.callback();
    },

    firstChild : function (node) {
        return node == null ? "" : node.firstChild.nodeValue
    },

    unpackReservationInstances : function (resId, ownerId, groups, instanceItems) {
        var list = new Array();

        for (var j = 0; j < instanceItems.length; j++) {
            if (instanceItems[j].nodeName == '#text') continue;

            var instanceId = getNodeValueByName(instanceItems[j], "instanceId");
            var imageId = getNodeValueByName(instanceItems[j], "imageId");

            var instanceState = instanceItems[j].getElementsByTagName("instanceState")[0];
            var stateName = getNodeValueByName(instanceState, "name");

            var dnsName = getNodeValueByName(instanceItems[j], "dnsName");
            var privateDnsName = getNodeValueByName(instanceItems[j], "privateDnsName");
            var keyName = getNodeValueByName(instanceItems[j], "keyName");
            var reason = getNodeValueByName(instanceItems[j], "reason");
            var amiLaunchIdx = getNodeValueByName(instanceItems[j], "amiLaunchIndex");
            var instanceType = getNodeValueByName(instanceItems[j], "instanceType");
	    var rootDeviceType = getNodeValueByName(instanceItems[j], "rootDeviceType");
            var monitoring = instanceItems[j].getElementsByTagName("monitoring")[0];
	    if(monitoring){
		var monitoringState = getNodeValueByName(monitoring, "state");
	    }
            
            var launchTime = new Date();
            launchTime.setISO8601(getNodeValueByName(instanceItems[j], "launchTime"));

            var placementElem = instanceItems[j].getElementsByTagName("placement")[0];
            var availabilityZone = placementElem.getElementsByTagName("availabilityZone")[0].firstChild;
            var placement = {
                "availabilityZone" : availabilityZone != null ? availabilityZone.nodeValue : null
            };
            // This value might not exist, but getNodeValueByName
            // returns "" in case the element is not defined.
            var platform = getNodeValueByName(instanceItems[j], "platform");
            if (!isWindows(platform)) {
                var kernelId = getNodeValueByName(instanceItems[j], "kernelId");
                var ramdiskId = getNodeValueByName(instanceItems[j], "ramdiskId");
            }

            list.push(new Instance(resId,
                                   ownerId,
                                   groups,
                                   instanceId,
                                   imageId,
                                   kernelId || "",
                                   ramdiskId || "",
                                   stateName,
                                   dnsName,
                                   privateDnsName,
                                   keyName,
                                   reason,
                                   amiLaunchIdx,
                                   instanceType,
				   rootDeviceType,
                                   launchTime,
                                   placement,
                                   platform,
                                   monitoringState || ""));
        }

        return list;
    },

    runInstances : function (imageId, kernelId, ramdiskId, minCount, maxCount, keyName, securityGroups, userData, properties, instanceType, placement, addressingType, callback) {
        var params = []
        //Just checking for ec2 or not
        if (ec2ui_session.isAmazonEndpointSelected()) {
            params.push(["ImageId", imageId]);
            if (kernelId != null && kernelId != "") {
                params.push(["KernelId", kernelId]);
            }
            if (ramdiskId != null && ramdiskId != "") {
                params.push(["RamdiskId", ramdiskId]);
            }
        }
        else {
            params.push(["ImageId", imageId.replace("ami-","emi-")]);
            if (kernelId != null && kernelId != "") {
                params.push(["KernelId", kernelId.replace("aki-","eki-")]);
            }
            if (ramdiskId != null && ramdiskId != "") {
                params.push(["RamdiskId", ramdiskId.replace("ari-","eri-")]);
            }
        }
        
        params.push(["InstanceType", instanceType]);
        params.push(["MinCount", minCount]);
        params.push(["MaxCount", maxCount]);
        if (keyName != null && keyName != "") {
            params.push(["KeyName", keyName]);
        }
        for(var i in securityGroups) {
            params.push(["SecurityGroup."+(i+1), securityGroups[i]]);
        }
        if (userData != null) {
            var b64str = "Base64:";
            if (userData.indexOf(b64str) != 0) {
                // This data needs to be encoded
                userData = Base64.encode(userData);
            } else {
                userData = userData.substring(b64str.length);
            }
            log(userData);
            params.push(["UserData", userData]);
        }
        if (properties != null) {
            params.push(["AdditionalInfo", properties]);
        }
        if (placement.availabilityZone != null && placement.availabilityZone != "") {
            params.push(["Placement.AvailabilityZone", placement.availabilityZone]);
        }
        params.push(["AddressingType", addressingType]);	//cmb: make the instance request with addressing type included.
        ec2_httpclient.queryEC2("RunInstances", params, this, true, "onCompleteRunInstances", callback);
    },

    onCompleteRunInstances : function (objResponse) {
        var xmlDoc = objResponse.xmlDoc;

        var list = new Array();
        var items = xmlDoc.evaluate("/",
                                    xmlDoc,
                                    this.getNsResolver(),
                                    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                                    null);
        for(var i=0 ; i < items.snapshotLength; i++) {
            var resId = getNodeValueByName(items.snapshotItem(i), "reservationId");
            var ownerId = getNodeValueByName(items.snapshotItem(i), "ownerId");
            var groups = new Array();
            var groupIds = items.snapshotItem(i).getElementsByTagName("groupName");
            for (var j = 0; j < groupIds.length; j++) {
                groups.push(groupIds[j].firstChild.nodeValue);
            }
            if (items.snapshotItem(i).nodeName){
                var instancesSet = items.snapshotItem(i).getElementsByTagName("instancesSet")[0];
                var instanceItems = instancesSet.childNodes;
            }

            if (instanceItems) {
                var resList = this.unpackReservationInstances(resId, ownerId, groups, instanceItems);
                for (var j = 0; j < resList.length; j++) {
                    list.push(resList[j]);
                }
            }
        }

        if (objResponse.callback)
            objResponse.callback(list);
    },
    
    monitorInstances : function (instanceIds, callback) {
        var params = []
        
        for(var i in instanceIds) {
            params.push(["InstanceId."+(i+1), instanceIds[i]]);
        }
        ec2_httpclient.queryEC2("MonitorInstances", params, this, true, "onCompleteMonitorInstances", callback);
    },

    onCompleteMonitorInstances : function (objResponse) {
        var xmlDoc = objResponse.xmlDoc;

        var list = new Array();
        var items = xmlDoc.evaluate("/",
                                    xmlDoc,
                                    this.getNsResolver(),
                                    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                                    null);
        for(var i=0 ; i < items.snapshotLength; i++) {
            var instancesSet = items.snapshotItem(i).getElementsByTagName("instancesSet")[0];
            var instanceItems = instancesSet.getElementsByTagName("item");
            for (var j = 0; j < instanceItems.length; j++) {
                var instanceId = getNodeValueByName(instanceItems[j], "instanceId");
                list.push({id:instanceId});
            }
        }

        if (objResponse.callback)
            objResponse.callback(list);
    },

    unmonitorInstances : function (instanceIds, callback) {
        var params = []
        
        for(var i in instanceIds) {
            params.push(["InstanceId."+(i+1), instanceIds[i]]);
        }
        ec2_httpclient.queryEC2("UnmonitorInstances", params, this, true, "onCompleteUnmonitorInstances", callback);
    },

    onCompleteUnmonitorInstances : function (objResponse) {
        var xmlDoc = objResponse.xmlDoc;

        var list = new Array();
        var items = xmlDoc.evaluate("/",
                                    xmlDoc,
                                    this.getNsResolver(),
                                    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                                    null);
        for(var i=0 ; i < items.snapshotLength; i++) {
            var instancesSet = items.snapshotItem(i).getElementsByTagName("instancesSet")[0];
            var instanceItems = instancesSet.getElementsByTagName("item");
            for (var j = 0; j < instanceItems.length; j++) {
                var instanceId = getNodeValueByName(instanceItems[j], "instanceId");
                list.push({id:instanceId});
            }
        }

        if (objResponse.callback)
            objResponse.callback(list);
    },

    terminateInstances : function (instanceIds, callback) {
        var params = []
        for(var i in instanceIds) {
            params.push(["InstanceId."+(i+1), instanceIds[i]]);
        }
        ec2_httpclient.queryEC2("TerminateInstances", params, this, true, "onCompleteTerminateInstances", callback);
    },

    onCompleteTerminateInstances : function (objResponse) {
        var xmlDoc = objResponse.xmlDoc;

        var list = new Array();
        var items = xmlDoc.evaluate("/",
                                    xmlDoc,
                                    this.getNsResolver(),
                                    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                                    null);
        for(var i=0 ; i < items.snapshotLength; i++) {
            var instancesSet = items.snapshotItem(i).getElementsByTagName("instancesSet")[0];
            if(instancesSet){
                var instanceItems = instancesSet.getElementsByTagName("item");
                for (var j = 0; j < instanceItems.length; j++) {
                    var instanceId = getNodeValueByName(instanceItems[j], "instanceId");
                    list.push({id:instanceId});
                }  
            }
        }

        if (objResponse.callback)
            objResponse.callback(list);
    },
    
    stopInstances : function (instanceIds, force, callback) {
        var params = []
        for(var i in instanceIds) {
            params.push(["InstanceId."+(i+1), instanceIds[i]]);
        }
        if (force == true) {
            params.push(["Force", "true"]);
        }
        ec2_httpclient.queryEC2("StopInstances", params, this, true, "onCompleteStopInstances", callback);
    },

    onCompleteStopInstances : function (objResponse) {
        var xmlDoc = objResponse.xmlDoc;

        var list = new Array();
        var items = xmlDoc.evaluate("/",
                                    xmlDoc,
                                    this.getNsResolver(),
                                    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                                    null);
        for(var i=0 ; i < items.snapshotLength; i++) {
            var instancesSet = items.snapshotItem(i).getElementsByTagName("instancesSet")[0];
            var instanceItems = instancesSet.getElementsByTagName("item");
            for (var j = 0; j < instanceItems.length; j++) {
                var instanceId = getNodeValueByName(instanceItems[j], "instanceId");
                list.push({id:instanceId});
            }
        }

        if (objResponse.callback)
            objResponse.callback(list);
    },

    startInstances : function (instanceIds, callback) {
        var params = []
        for(var i in instanceIds) {
            params.push(["InstanceId."+(i+1), instanceIds[i]]);
        }
        ec2_httpclient.queryEC2("StartInstances", params, this, true, "onCompleteStartInstances", callback);
    },

    onCompleteStartInstances : function (objResponse) {
        var xmlDoc = objResponse.xmlDoc;

        log("onCompleteStartInstances invoked");
        var list = new Array();
        var items = xmlDoc.evaluate("/",
                                    xmlDoc,
                                    this.getNsResolver(),
                                    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                                    null);
        for(var i=0 ; i < items.snapshotLength; i++) {
            var instancesSet = items.snapshotItem(i).getElementsByTagName("instancesSet")[0];
            var instanceItems = instancesSet.getElementsByTagName("item");
            for (var j = 0; j < instanceItems.length; j++) {
                var instanceId = getNodeValueByName(instanceItems[j], "instanceId");
                list.push({id:instanceId});
            }
        }

        if (objResponse.callback)
            objResponse.callback(list);
    },

    describeInstances : function (callback) {
        ec2_httpclient.queryEC2("DescribeInstances", [], this, true, "onCompleteDescribeInstances", callback);
    },

    onCompleteDescribeInstances : function (objResponse) {
        var xmlDoc = objResponse.xmlDoc;

        var list = new Array();
        var items = xmlDoc.evaluate("/ec2:DescribeInstancesResponse/ec2:reservationSet/ec2:item",
                                    xmlDoc,
                                    this.getNsResolver(),
                                    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                                    null);
        for(var i=0 ; i < items.snapshotLength; i++) {
            var resId = getNodeValueByName(items.snapshotItem(i), "reservationId");
            var ownerId = getNodeValueByName(items.snapshotItem(i), "ownerId");
            var groups = new Array();
            var groupIds = items.snapshotItem(i).getElementsByTagName("groupId");
            for (var j = 0; j < groupIds.length; j++) {
                groups.push(groupIds[j].firstChild.nodeValue);
            }
            var instancesSet = items.snapshotItem(i).getElementsByTagName("instancesSet")[0];
            var instanceItems = instancesSet.childNodes;

            if (instanceItems) {
                var resList = this.unpackReservationInstances(resId, ownerId, groups, instanceItems);
                list = list.concat(resList);
            }
        }

        this.addResourceTags(list, ec2ui_session.model.resourceMap.instances, "id");
        ec2ui_model.updateInstances(list);
        if (objResponse.callback)
            objResponse.callback(list);
    },

    addResourceTags : function (list, resourceType, attribute) {
        if (!list || list.length == 0) {
            return;
        }

        var tags = ec2ui_session.getResourceTags(resourceType);

        if (!tags) {
            return;
        }

        var new_tags = ec2ui_prefs.getEmptyWrappedMap();
        var res = null;
        var tag = null;
        for (var i in list) {
            res = list[i];
            tag = tags.get(res[attribute]);
            if (tag && tag.length) {
                res.tag = unescape(tag);
                new_tags.put(res[attribute], escape(res.tag));
            }
        }
        // Now that we've built the new set of instance tags, persist them
        ec2ui_session.setResourceTags(resourceType, new_tags);
    },

    retrieveBundleTaskFromResponse : function (item) {
       var instanceId = getNodeValueByName(item, "instanceId");
       var id = getNodeValueByName(item, "bundleId");
       var state = getNodeValueByName(item, "state");

       var startTime = new Date();
       startTime.setISO8601(getNodeValueByName(item, "startTime"));

       var updateTime = new Date();
       updateTime.setISO8601(getNodeValueByName(item, "updateTime"));

       var storage = item.getElementsByTagName("storage")[0];
       var s3bucket = getNodeValueByName(storage, "bucket");
       var s3prefix = getNodeValueByName(storage, "prefix");
       var error = item.getElementsByTagName("error")[0];
       var errorMsg = "";
       if (error) {
           errorMsg = getNodeValueByName(error, "message");
       }
       var progress = getNodeValueByName(item, "progress");
       if (progress.length > 0) {
           state += " " + progress;
       }

       return new BundleTask(id, instanceId, state, startTime, updateTime, s3bucket, s3prefix, errorMsg);
   },

    parseBundleInstanceResponse : function (xmlDoc) {
        var list = new Array();

        var items = xmlDoc.getElementsByTagName("bundleInstanceTask");
        for(var i=0; i < items.length; ++i) {
            list.push(this.retrieveBundleTaskFromResponse(items[i]));
        }

        return list;
    },

    parseDescribeBundleTasksResponse : function (xmlDoc) {
       var list = new Array();

       var items = xmlDoc.evaluate("/ec2:DescribeBundleTasksResponse/ec2:bundleInstanceTasksSet/ec2:item",
                                    xmlDoc,
                                    this.getNsResolver(),
                                    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                                    null);
       for(var i=0; i < items.snapshotLength; ++i) {
           list.push(this.retrieveBundleTaskFromResponse(items.snapshotItem(i)));
       }

       return list;
    },

    describeBundleTasks : function (callback) {
        ec2_httpclient.queryEC2("DescribeBundleTasks", [], this, true, "onCompleteDescribeBundleTasks", callback);
    },

    onCompleteDescribeBundleTasks : function (objResponse) {
       var list = this.parseDescribeBundleTasksResponse(objResponse.xmlDoc);

       ec2ui_model.updateBundleTasks(list);
       if (objResponse.callback) {
           objResponse.callback(list);
       }
    },

    // Returns either the US or EU S3 endpoint
    getS3URL : function(bucket, region) {
        var suffix = null;

        // If a region wasn't passed, get the ACL for an
        // object in the currently active region
        if (!region) {
            region = ec2ui_session.getActiveEndpoint().name;
        }

        region = region.toLowerCase();

        if (region.indexOf("eu") == 0) {
            suffix = ".s3-external-3.amazonaws.com";
        } else {
            suffix = ".s3.amazonaws.com";
        }
        return "http://" + bucket + suffix;
    },

    // Returns true/false based on whether the copy operation was initiated
    copyS3Key : function(srcB, key, dstB, destReg, callback, xmlhttp) {
        // 0 - FAILURE
        // 1 - SUCCESS
        // 2 - FILE_EXISTS
        var ret = fileCopyStatus.FAILURE;

        if (destReg == null ||
            destReg.length == 0 ||
            srcB == null ||
            srcB.length == 0) {
            return ret;
        }

        if (key == null ||
            key.length == 0 ||
            dstB == null ||
            dstB.length == 0) {
            return ret;
        }

        if (callback == undefined) {
            return ret;
        }

        var params = "/" + key;

        if (false) {
            // Check to see whether the key exists in the bucket already
            httpRsp = ec2_httpclient.makeS3HTTPRequest("HEAD",
                                                       "/" + dstB + params,
                                                       this.getS3URL(dstB, destReg) + params,
                                                       null,
                                                       xmlhttp
                                                      );

            if (!httpRsp.hasErrors ||
                (httpRsp.hasErrors && (httpRsp.xmlhttp.status == 403))) {
                log("File exists, no need to copy it");
                ret = fileCopyStatus.FILE_EXISTS;
            }

            if (ret == fileCopyStatus.FILE_EXISTS) {
                sleep(10);
                return ret;
            }
        }

        // Need to copy this key from source to destination
        var msg = "Copying key: " + key;
        msg += " from Source: " + srcB + " to Dest: " + dstB;
        log(msg);

        var resp = ec2_httpclient.makeS3HTTPRequest(
            "PUT",
            "/" + dstB + params,
            this.getS3URL(dstB, destReg) + params,
            null,
            xmlhttp,
            "/" + srcB + params,
            true,
            "onCompleteCopyS3Key",
            this,
            callback
            );

        return !resp.hasErrors;
    },

    onCompleteCopyS3Key : function(objResponse) {
        var callback = objResponse.callback;
        if (callback) {
            callback(objResponse);
        }
    },

    // Returns the acl or ""
    getS3ACL : function(bucket, key, region) {
        if (bucket == null ||
            bucket.length == 0) {
            return null;
        }

        if (!key) {
            key = "";
        }

        log("Enumerating ACLs for Bucket: " + bucket);
        var params = "/" + key + "?acl";
        var httpRsp = ec2_httpclient.makeS3HTTPRequest(
            "GET",
            "/" + bucket + params,
            this.getS3URL(bucket, region) + params
            );

        if (!httpRsp.hasErrors) {
            var xmlhttp = httpRsp.xmlhttp;
            if (xmlhttp) {
                var doc = xmlhttp.responseXML;
                if (doc == null) {
                    doc = new DOMParser().parseFromString(xmlhttp.responseText,
                                                          "text/xml");
                }

                var serializer = new XMLSerializer();
                return serializer.serializeToString(doc.firstChild);
            }
        }

        return "";
    },

    // Returns true/false based on whether the acl could be set
    setS3ACL : function(bucket, key, region, acl, xmlhttp) {
        if (bucket == null ||
            bucket.length == 0) {
            return false;
        }

        if (!key) {
            key = "";
        }

        if (acl == null ||
            acl.length == 0) {
            return true;
        }

        log("Setting ACL on Key: " + key);
        var params = "/" + key + "?acl";
        var httpRsp = ec2_httpclient.makeS3HTTPRequest(
            "PUT",
            "/" + bucket + params,
            this.getS3URL(bucket, region) + params,
            acl,
            xmlhttp
            );

        return !httpRsp.hasErrors;
    },

    // Returns true or false
    writeS3KeyInBucket : function(bucket, key, content, region) {
        if (key == null ||
            key.length == 0 ||
            bucket == null ||
            bucket.length == 0) {
            return false;
        }

        var params = "/" + key;
        var httpRsp = ec2_httpclient.makeS3HTTPRequest(
            "PUT",
            "/" + bucket + params,
            this.getS3URL(bucket, region) + params,
            content
            );

        return !httpRsp.hasErrors;
    },

    // Returns true or false
    deleteS3KeyFromBucket : function(bucket, key, region) {
        if (key == null ||
            key.length == 0 ||
            bucket == null ||
            bucket.length == 0) {
            // return false;
        }

        var params = "/" + key;
        ec2_httpclient.makeS3HTTPRequest(
            "DELETE",
            "/" + bucket + params,
            this.getS3URL(bucket, region) + params
            );

        return true;
    },

    // Returns a list of parts or null
    getS3KeyListWithPrefixInBucket : function(prefix, bucket, region) {
        if (prefix == null ||
            prefix.length == 0 ||
            bucket == null ||
            bucket.length == 0) {
            return null;
        }

        log("Enumerating keys with prefix " + prefix + " in bucket " + bucket);
        var list = null;
        var params = "/?prefix=" + prefix;
        var httpRsp = ec2_httpclient.makeS3HTTPRequest(
            "GET",
            "/" + bucket + "/",
            this.getS3URL(bucket, region) + params
            );

        if (!httpRsp.hasErrors) {
            var respXML = new DOMParser().parseFromString(httpRsp.xmlhttp.responseText,
                                                          "text/xml");
            var items = respXML.getElementsByTagName("Contents");
            list = new Array(items.length);
            for (var i = 0; i < items.length; ++i) {
                list[i] = getNodeValueByName(items[i], "Key");
            }
            log("# Keys retrieved: " + list.length);
        }

        return list;
    },

    doesS3BucketExist : function(bucket, region) {
        var fileName = "/" + bucket + "/";
        var s3url = this.getS3URL(bucket, region) + "/?max-keys=0";
        var fSuccess = false;
        var httpRsp = ec2_httpclient.makeS3HTTPRequest("HEAD",
                                                       fileName,
                                                       s3url);

        if (httpRsp.hasErrors) {
            if (httpRsp.xmlhttp.status == 403) {
                // Forbidden to access this but the bucket does exist!
                log("Bucket exists");
                fSuccess = true;
            }
        } else {
            // No errors!
            fSuccess = true;
        }

        log("Bucket '" + bucket + "' exists?: " + fSuccess);
        return fSuccess;
    },

    // Returns the bucket location or null
    getS3BucketLocation : function(bucket) {
        var mult = 1;
        for (var i = 0; i < 3; ++i) {
            if (this.doesS3BucketExist(bucket)) {
                break;
            }
            // Sleep before trying again
            sleep(1000 * mult);
        }

        var httpRsp = null;

        mult = 1;
        for (i = 0; i < 3; ++i) {
            httpRsp = ec2_httpclient.makeS3HTTPRequest("GET",
                                                       "/" + bucket + "/?location",
                                                       this.getS3URL(bucket) + "/?location");

            if (!httpRsp.hasErrors) {
                var respXML = httpRsp.xmlhttp.responseXML;
                if (respXML) {
                    var loc = getNodeValueByName(respXML, "LocationConstraint") || "";
                    if (loc.length == 0) {
                        loc = "US";
                    }
                    return loc;
                }
            }
            // Sleep before trying again
            sleep(1000 * mult);
            mult += mult;
        }

        return null;
    },

    // Returns true/false based on whether the bucket could be created
    createS3Bucket : function(bucket, region) {
        var fileName = "/" + bucket + "/";
        var s3url = this.getS3URL(bucket, region);
        var fSuccess = false;
        var httpRsp = null;
        var content = null;
        var respXML = null;

        // Check if the bucket already exists
        for (var i = 0; i < 2; ++i) {
            fSuccess = this.doesS3BucketExist(bucket, region);
            if (fSuccess) {
                break;
            }

            // Sleep a 100ms before trying again
            sleep(100);
        }

        // It doesn't exist, so create it
        if (!fSuccess) {
            if (region && region == "EU") {
                content = "<CreateBucketConstraint><LocationConstraint>EU</LocationConstraint></CreateBucketConstraint>";
            }

            log(s3url + ": URL, Content: " + content || "");
            httpRsp = ec2_httpclient.makeS3HTTPRequest(
               "PUT",
               fileName,
               s3url,
               content
               );

            // The operation succeeded if there were no errors
            fSuccess = !httpRsp.hasErrors;
        }

        if (!fSuccess) {
            respXML = httpRsp.xmlhttp.responseXML;
            var errorMsg = getNodeValueByName(respXML, "Message");
            var errorCode = getNodeValueByName(respXML, "Code");
            alert ("Could not create S3 bucket. Error: " + errorCode + " - " + errorMsg);
            var toSign = getNodeValueByName(respXML, "StringToSignBytes");
            toSign = "0x" + toSign;
            toSign = toSign.replace(/\s/g, " 0x");
            toSign = toSign.split(" ");
            log(byteArrayToString(toSign));
        }

        return fSuccess;
    },

    bundleInstance : function (instanceId, bucket, prefix, activeCred, callback) {
        // Generate the S3 policy string using the bucket and prefix
        var s3policy = generateS3Policy(bucket, prefix);
        log("S3 Policy["+s3policy+"]");

        var s3polb64 = Base64.encode(s3policy);
        log("S3 Policy B64["+s3polb64+"]");

        // Sign the generated policy with the secret key
        var policySig = b64_hmac_sha1(activeCred.secretKey, s3polb64);
        log("S3 Policy Sig["+policySig+"]");

        var params = []
        params.push(["InstanceId", instanceId]);
        params.push(["Storage.S3.Bucket", bucket]);
        params.push(["Storage.S3.Prefix", prefix]);
        params.push(["Storage.S3.AWSAccessKeyId", activeCred.accessKey]);
        params.push(["Storage.S3.UploadPolicy", s3polb64]);
        params.push(["Storage.S3.UploadPolicySignature", policySig]);

        ec2_httpclient.queryEC2("BundleInstance", params, this, true, "onCompleteBundleInstance", callback);
    },

    onCompleteBundleInstance : function (objResponse) {
        // Parse the XML Response
        var list = this.parseBundleInstanceResponse(objResponse.xmlDoc);

        // Ensure that the UI knows to update its view
        if (objResponse.callback) {
            objResponse.callback(list);
        }
    },

    cancelBundleTask : function (id, callback) {
        var params = []
        params.push(["BundleId", id]);

        ec2_httpclient.queryEC2("CancelBundleTask", params, this, true, "onCompleteCancelBundleTask", callback);
    },

    onCompleteCancelBundleTask : function (objResponse) {
        // No need to parse the response since we only
        // need to refresh the list of bundle tasks.
        if (objResponse.callback) {
            objResponse.callback();
        }
    },

    describeKeypairs : function (callback) {
        ec2_httpclient.queryEC2("DescribeKeyPairs", [], this, true, "onCompleteDescribeKeypairs", callback);
    },

    onCompleteDescribeKeypairs : function (objResponse) {
        var xmlDoc = objResponse.xmlDoc;

        var list = new Array();
        var items = xmlDoc.getElementsByTagName("item");
        for (var i = 0; i < items.length; i++)
        {
            var name = getNodeValueByName(items[i], "keyName");
            var fp = getNodeValueByName(items[i], "keyFingerprint");
            list.push(new KeyPair(name, fp));
        }

        ec2ui_model.updateKeypairs(list);
        if (objResponse.callback)
            objResponse.callback(list);
    },

    describeSecurityGroups : function (callback) {
        ec2_httpclient.queryEC2("DescribeSecurityGroups", [], this, true, "onCompleteDescribeSecurityGroups", callback);
    },

    onCompleteDescribeSecurityGroups : function (objResponse) {
        var xmlDoc = objResponse.xmlDoc;

        var list = new Array();
        var items = xmlDoc.evaluate("/ec2:DescribeSecurityGroupsResponse/ec2:securityGroupInfo/ec2:item",
                                    xmlDoc,
                                    this.getNsResolver(),
                                    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                                    null);
        for(var i = 0 ; i < items.snapshotLength; i++) {
            var ownerId = getNodeValueByName(items.snapshotItem(i), "ownerId");
            var groupName = getNodeValueByName(items.snapshotItem(i), "groupName");
            var groupDescription = getNodeValueByName(items.snapshotItem(i), "groupDescription");
            log("Group name ["+groupName+"]");

            var ipPermissionsList = new Array();
            var ipPermissions = items.snapshotItem(i).getElementsByTagName("ipPermissions")[0];
            var ipPermissionsItems = ipPermissions.childNodes;
            if (ipPermissionsItems) {
                for (var j = 0; j < ipPermissionsItems.length; j++) {
                    if (ipPermissionsItems.item(j).nodeName == '#text') continue;
                    var ipProtocol = getNodeValueByName(ipPermissionsItems.item(j), "ipProtocol");
                    var fromPort = getNodeValueByName(ipPermissionsItems.item(j), "fromPort");
                    var toPort = getNodeValueByName(ipPermissionsItems.item(j), "toPort");
                    log("Group ipp ["+ipProtocol+":"+fromPort+"-"+toPort+"]");

                    var groupTuples = new Array();
                    var groups = ipPermissionsItems[j].getElementsByTagName("groups")[0];
                    if (groups) {
                        var groupsItems = groups.childNodes;
                        for (var k = 0; k < groupsItems.length; k++) {
                            if (groupsItems.item(k).nodeName == '#text') continue;
                            var userId = getNodeValueByName(groupsItems[k], "userId");
                            var srcGroupName = getNodeValueByName(groupsItems[k], "groupName");
                            groupTuples.push([userId, srcGroupName]);
                            ipPermissionsList.push(new Permission(ipProtocol, fromPort, toPort, [[userId, srcGroupName]], []));
                        }
                    }

                    var cidrList = new Array();
                    var ipRanges = ipPermissionsItems[j].getElementsByTagName("ipRanges")[0];
                    if (ipRanges) {
                        var ipRangesItems = ipRanges.childNodes;
                        for (var k = 0; k < ipRangesItems.length; k++) {
                            if (ipRangesItems.item(k).nodeName == '#text') continue;
                            var cidrIp = getNodeValueByName(ipRangesItems[k], "cidrIp");
                            cidrList.push(cidrIp);
                            ipPermissionsList.push(new Permission(ipProtocol, fromPort, toPort, [], [cidrIp]));
                        }
                    }
                    //ipPermissionsList.push(new Permission(ipProtocol, fromPort, toPort, groupTuples, cidrList));
                }
            }

            list.push(new SecurityGroup(ownerId, groupName, groupDescription, ipPermissionsList));
        }

        ec2ui_model.updateSecurityGroups(list);
        if (objResponse.callback)
            objResponse.callback(list);
    },

    createKeypair : function (name, callback) {
        ec2_httpclient.queryEC2("CreateKeyPair", [["KeyName", name]], this, true, "onCompleteCreateKeyPair", callback);
    },

    onCompleteCreateKeyPair : function (objResponse) {
        var xmlDoc = objResponse.xmlDoc;

        var name = getNodeValueByName(xmlDoc, "keyName");
        var fp = getNodeValueByName(xmlDoc, "keyFingerprint");
        var keyMaterial = getNodeValueByName(xmlDoc, "keyMaterial");

        // I'm lazy, so for now the caller will just have to call describeKeypairs again to see
        // the new keypair.

        if (objResponse.callback)
            objResponse.callback(name, keyMaterial);
    },

    deleteKeypair : function (name, callback) {
        ec2_httpclient.queryEC2("DeleteKeyPair", [["KeyName", name]], this, true, "onCompleteDeleteKeyPair", callback);
    },

    onCompleteDeleteKeyPair : function (objResponse) {
        if (objResponse.callback)
            objResponse.callback();
    },

    createSecurityGroup : function (name, desc, callback) {
        ec2_httpclient.queryEC2("CreateSecurityGroup", [["GroupName", name], ["GroupDescription", desc]], this, true, "onCompleteCreateSecurityGroup", callback);
    },

    onCompleteCreateSecurityGroup : function (objResponse) {
        if (objResponse.callback)
            objResponse.callback();
    },

    deleteSecurityGroup : function (name, callback) {
        ec2_httpclient.queryEC2("DeleteSecurityGroup", [["GroupName", name]], this, true, "onCompleteDeleteSecurityGroup", callback);
    },

    onCompleteDeleteSecurityGroup : function (objResponse) {
        if (objResponse.callback)
            objResponse.callback();
    },

    authorizeSourceCIDR : function (groupName, ipProtocol, fromPort, toPort, cidrIp, callback) {
        var params = []
        params.push(["GroupName", groupName]);
        params.push(["IpProtocol", ipProtocol]);
        params.push(["FromPort", fromPort]);
        params.push(["ToPort", toPort]);
        params.push(["CidrIp", cidrIp]);
        ec2_httpclient.queryEC2("AuthorizeSecurityGroupIngress", params, this, true, "onCompleteAuthorizeSecurityGroupIngress", callback);
    },

    authorizeSourceGroup : function (groupName, sourceSecurityGroupName, sourceSecurityGroupOwnerId, callback) {
        var params = []
        params.push(["GroupName", groupName]);
        params.push(["SourceSecurityGroupName", sourceSecurityGroupName]);
        params.push(["SourceSecurityGroupOwnerId", sourceSecurityGroupOwnerId]);
        ec2_httpclient.queryEC2("AuthorizeSecurityGroupIngress", params, this, true, "onCompleteAuthorizeSecurityGroupIngress", callback);
    },

    onCompleteAuthorizeSecurityGroupIngress : function (objResponse) {
        if (objResponse.callback)
            objResponse.callback();
    },

    revokeSourceCIDR : function (groupName, ipProtocol, fromPort, toPort, cidrIp, callback) {
        var params = []
        params.push(["GroupName", groupName]);
        params.push(["IpProtocol", ipProtocol]);
        params.push(["FromPort", fromPort]);
        params.push(["ToPort", toPort]);
        params.push(["CidrIp", cidrIp]);
        ec2_httpclient.queryEC2("RevokeSecurityGroupIngress", params, this, true, "onCompleteRevokeSecurityGroupIngress", callback);
    },

    revokeSourceGroup : function (groupName, sourceSecurityGroupName, sourceSecurityGroupOwnerId, callback) {
        var params = []
        params.push(["GroupName", groupName]);
        params.push(["SourceSecurityGroupName", sourceSecurityGroupName]);
        params.push(["SourceSecurityGroupOwnerId", sourceSecurityGroupOwnerId]);
        ec2_httpclient.queryEC2("RevokeSecurityGroupIngress", params, this, true, "onCompleteRevokeSecurityGroupIngress", callback);
    },

    onCompleteRevokeSecurityGroupIngress : function (objResponse) {
        if (objResponse.callback)
            objResponse.callback();
    },

    rebootInstances : function (instanceIds, callback) {
        var params = []
        for(var i in instanceIds) {
            params.push(["InstanceId."+(i+1), instanceIds[i]]);
        }
        ec2_httpclient.queryEC2("RebootInstances", params, this, true, "onCompleteRebootInstances", callback);
    },

    onCompleteRebootInstances : function (objResponse) {
        if (objResponse.callback)
            objResponse.callback();
    },

    getConsoleOutput : function (instanceId, callback) {
        return ec2_httpclient.queryEC2("GetConsoleOutput", [["InstanceId", instanceId]], this, true, "onCompleteGetConsoleOutput", callback);
    },

    onCompleteGetConsoleOutput : function (objResponse) {
        var xmlDoc = objResponse.xmlDoc;
        var instanceId = getNodeValueByName(xmlDoc, "instanceId");
        var timestamp = getNodeValueByName(xmlDoc, "timestamp");
        var output = xmlDoc.getElementsByTagName("output")[0];
        if (output.textContent) {
            output = Base64.decode(output.textContent);
            output = output.replace(/\x1b/mg, "\n").replace(/\r/mg, "").replace(/\n+/mg, "\n");
            //output = output.replace(/\n+/mg, "\n")
        } else {
            output = "";
        }

        if (objResponse.callback)
            objResponse.callback(instanceId, timestamp, output);
        return output;
    },

    describeAvailabilityZones : function (callback) {
        ec2_httpclient.queryEC2("DescribeAvailabilityZones", [], this, true, "onCompleteDescribeAvailabilityZones", callback);
    },

    onCompleteDescribeAvailabilityZones : function (objResponse) {
        var xmlDoc = objResponse.xmlDoc;

        var list = new Array();
        var items = xmlDoc.getElementsByTagName("item");
        for (var i = 0; i < items.length; i++)
        {
            var name = getNodeValueByName(items[i], "zoneName");
            var state = getNodeValueByName(items[i], "zoneState");
            list.push(new AvailabilityZone(name, state));
        }

        ec2ui_model.updateAvailabilityZones(list);
        if (objResponse.callback)
            objResponse.callback(list);
    },

    describeAddresses : function (callback) {
        ec2_httpclient.queryEC2("DescribeAddresses", [], this, true, "onCompleteDescribeAddresses", callback);
    },

    onCompleteDescribeAddresses : function (objResponse) {
        var xmlDoc = objResponse.xmlDoc;

        var list = new Array();
        var items = xmlDoc.getElementsByTagName("item");
        for (var i = 0; i < items.length; i++)
        {
            var publicIp = getNodeValueByName(items[i], "publicIp");
            var instanceid = getNodeValueByName(items[i], "instanceId");
            list.push(new AddressMapping(publicIp, instanceid));
        }

        this.addResourceTags(list, ec2ui_session.model.resourceMap.eips, "address");
        ec2ui_model.updateAddresses(list);
        if (objResponse.callback)
            objResponse.callback(list);
    },

    allocateAddress : function (callback) {
        ec2_httpclient.queryEC2("AllocateAddress", [], this, true, "onCompleteAllocateAddress", callback);
    },

    onCompleteAllocateAddress : function (objResponse) {
        var xmlDoc = objResponse.xmlDoc;

        var address = getNodeValueByName(xmlDoc, "publicIp");

        if (objResponse.callback)
            objResponse.callback(address);
    },

    releaseAddress : function (address, callback) {
        ec2_httpclient.queryEC2("ReleaseAddress", [['PublicIp', address]], this, true, "onCompleteReleaseAddress", callback);
    },

    onCompleteReleaseAddress : function (objResponse) {
        if (objResponse.callback)
            objResponse.callback();
    },

    associateAddress : function (address, instanceid, callback) {
        ec2_httpclient.queryEC2("AssociateAddress", [['PublicIp', address], ['InstanceId', instanceid]], this, true, "onCompleteAssociateAddress", callback);
    },

    onCompleteAssociateAddress : function (objResponse) {
        if (objResponse.callback)
            objResponse.callback();
    },

    disassociateAddress : function (address, callback) {
        ec2_httpclient.queryEC2("DisassociateAddress", [['PublicIp', address]], this, true, "onCompleteDisassociateAddress", callback);
    },

    onCompleteDisassociateAddress : function (objResponse) {
        if (objResponse.callback)
            objResponse.callback();
    },

    describeRegions : function (callback) {
        ec2_httpclient.queryEC2("DescribeRegions", [], this, true, "onCompleteDescribeRegions", callback);
    },

    onCompleteDescribeRegions : function (objResponse) {
        var xmlDoc = objResponse.xmlDoc;
        if(ec2ui_session.isAmazonEndpointSelected())
        {
            var items = xmlDoc.evaluate("/ec2:DescribeRegionsResponse/ec2:regionInfo/ec2:item",
                                    xmlDoc,
                                    this.getNsResolver(),
                                    XPathResult.ORDERED_NODE_SNAPSHOT_TYPE,
                                    null);
            var endPointMap = new Object();
            for (var i = 0; i < items.snapshotLength; ++i)
            {
                var name = getNodeValueByName(items.snapshotItem(i), "regionName");
                var type = "ec2";
		var url = getNodeValueByName(items.snapshotItem(i), "regionEndpoint");
                    if (url.indexOf("https://") != 0) {
                    url = "https://" + url;
                    }
	        endPointMap[name] = new Endpoint(name, type, url);
                log("name: " + name + ", type:" + type + ", url: " + url);
	    }

            if (objResponse.callback) {
            objResponse.callback(endPointMap);
            }
	}
    },

    onResponseComplete : function (responseObject) {
        // For async requests, we should always call back
        if (!responseObject.isAsync &&
            responseObject.hasErrors) {
            return;
        }

        eval("this."+responseObject.requestType+"(responseObject)");
    },
    
    describeLoadBalancers : function (callback) {
        ec2_httpclient.queryELB("DescribeLoadBalancers", [], this, true, "onCompleteDescribeLoadBalancers", callback);
    },

    onCompleteDescribeLoadBalancers : function (objResponse) {
        var xmlDoc = objResponse.xmlDoc;
        var list = new Array();
        var items = xmlDoc.getElementsByTagName("member");
        for (var i = 0; i < items.length; i++)
        {
	    var LoadBalancerName = getNodeValueByName(items[i], "LoadBalancerName");
            var CreatedTime = getNodeValueByName(items[i], "CreatedTime");
            var DNSName = getNodeValueByName(items[i], "DNSName");
	    var Instances = new Array();
            var InstanceId = items[i].getElementsByTagName("InstanceId");
            for (var j = 0; j < InstanceId.length; j++) {
		Instances.push(InstanceId[j].firstChild.nodeValue);
            }

	    var listener = items[i].getElementsByTagName("ListenerDescriptions");
            for (var k = 0; k < listener.length; k++)
            {
                var Protocol = getNodeValueByName(listener[k], "Protocol");
                var LoadBalancerPort = getNodeValueByName(listener[k], "LoadBalancerPort");
                var InstancePort = getNodeValueByName(listener[k], "InstancePort");
            }
  
            var HealthCheck = items[i].getElementsByTagName("HealthCheck");      
            for (var k = 0; k < HealthCheck.length; k++)
            {
                var Interval = getNodeValueByName(HealthCheck[k], "Interval");
                var Timeout = getNodeValueByName(HealthCheck[k], "Timeout");
                var HealthyThreshold = getNodeValueByName(HealthCheck[k], "HealthyThreshold");
                var UnhealthyThreshold = getNodeValueByName(HealthCheck[k], "UnhealthyThreshold");
                var Target = getNodeValueByName(HealthCheck[k], "Target");
            }
            
	    var azone = new Array();
            var AvailabilityZones = items[i].getElementsByTagName("AvailabilityZones");      
            for (var k = 0; k < AvailabilityZones.length; k++)
            {
	        var zone = AvailabilityZones[k].getElementsByTagName("member");
		for (var j = 0; j < zone.length; j++) {
		    azone.push(zone[j].firstChild.nodeValue);
		}
	    }
	        
	    var AppCookieStickinessPolicies = items[i].getElementsByTagName("AppCookieStickinessPolicies");
	    for(var k = 0; k < AppCookieStickinessPolicies.length; k++){
		var CookieName = getNodeValueByName(AppCookieStickinessPolicies[k], "CookieName");
		var APolicyName = getNodeValueByName(AppCookieStickinessPolicies[k], "PolicyName");
	    }
	    
	    var LBCookieStickinessPolicies = items[i].getElementsByTagName("LBCookieStickinessPolicies");
	    for(var k = 0; k < LBCookieStickinessPolicies.length; k++){
		var CookieExpirationPeriod = getNodeValueByName(LBCookieStickinessPolicies[k], "CookieExpirationPeriod");
		var CPolicyName = getNodeValueByName(LBCookieStickinessPolicies[k], "PolicyName");
	    }
	    
	    if (LoadBalancerName != '' && CreatedTime != '')
            {
            list.push(new LoadBalancer(LoadBalancerName,CreatedTime, DNSName,
				       Instances,Protocol,LoadBalancerPort,InstancePort,
				       Interval,Timeout,
				       HealthyThreshold,
				       UnhealthyThreshold,
				       Target,azone,
				       CookieName,APolicyName,
				       CookieExpirationPeriod,CPolicyName));
            }
        }
        ec2ui_model.updateLoadbalancer(list);
        if (objResponse.callback)
            objResponse.callback(list);
    },
    
    describeInstanceHealth : function(LoadBalancerName,callback) {
	params = []
        params.push(["LoadBalancerName", LoadBalancerName]);
	
        ec2_httpclient.queryELB("DescribeInstanceHealth", params, this, true, "oncompletedescribeInstanceHealth", callback);
    },
    
    oncompletedescribeInstanceHealth : function(objResponse) {
	var xmlDoc = objResponse.xmlDoc;
        var list = new Array();
        var items = xmlDoc.getElementsByTagName("member");
        for (var i = 0; i < items.length; i++)
        {
            var Description = getNodeValueByName(items[i], "Description");
            var State = getNodeValueByName(items[i], "State");
            var InstanceId = getNodeValueByName(items[i], "InstanceId");
	    var ReasonCode = getNodeValueByName(items[i], "ReasonCode");
	    
	    list.push(new InstanceHealth(Description,State, InstanceId,ReasonCode));
        }
	
        ec2ui_model.updateInstanceHealth(list);
        if (objResponse.callback)
            objResponse.callback(list);        
    },
    
    deleteLoadBalancer : function(LoadBalancerName,callback) {
       params = []
       params.push(["LoadBalancerName", LoadBalancerName]);
       
       ec2_httpclient.queryELB("DeleteLoadBalancer", params, this, true, "oncompleteDeleteLoadBalancer", callback);        
    },
    
    oncompleteDeleteLoadBalancer : function(objResponse) {
	var xmlDoc = objResponse.xmlDoc;
        var items = getNodeValueByName(xmlDoc, "member");
        if (objResponse.callback)
            objResponse.callback(items);        
    },
    
    CreateLoadBalancer : function (LoadBalancerName,Protocol,elbport,instanceport,Zone,callback) {
	var params = []
	params.push(["LoadBalancerName", LoadBalancerName]);
	
	params.push(["AvailabilityZones.member.1", Zone]);
	params.push(["Listeners.member.Protocol", Protocol]);
	if (Protocol == "HTTPS")
	{
	    params.push(["Listeners.member.SSLCertificateId", "arn:aws:iam::322191361670:server-certificate/testCert"]);
	}
	params.push(["Listeners.member.LoadBalancerPort", elbport]);
	params.push(["Listeners.member.InstancePort", instanceport]);
	ec2_httpclient.queryELB("CreateLoadBalancer", params, this, true, "onCompleteCreateLoadBalancer", callback);
    },

    onCompleteCreateLoadBalancer: function (objResponse) {
	var xmlDoc = objResponse.xmlDoc;
        var items = getNodeValueByName(xmlDoc, "member");
        if (objResponse.callback)
            objResponse.callback(items);
    },
    
    ConfigureHealthCheck : function(LoadBalancerName,pingprotocol,pingport,pingpath,Interval,Timeout,HealthyThreshold,UnhealthyThreshold,callback){
       var params = []
       if (pingprotocol != null) params.push(["HealthCheck.Target" , pingprotocol+":"+pingport+"/"+pingpath]);
       if (LoadBalancerName != null) params.push(["LoadBalancerName", LoadBalancerName]);
       if (Interval != null) params.push(["HealthCheck.Interval", Interval]);
       if (Timeout != null) params.push(["HealthCheck.Timeout", Timeout]);
       if (HealthyThreshold != null) params.push(["HealthCheck.HealthyThreshold", HealthyThreshold]);
       if (UnhealthyThreshold != null) params.push(["HealthCheck.UnhealthyThreshold", UnhealthyThreshold]);
       
       ec2_httpclient.queryELB("ConfigureHealthCheck", params, this, true, "onCompleteConfigureHealthCheck", callback);
    },
    
    onCompleteConfigureHealthCheck : function(objResponse) {
        var xmlDoc = objResponse.xmlDoc;
        var items = getNodeValueByName(xmlDoc, "HealthCheck");
        if (objResponse.callback)
            objResponse.callback(items);
        
    },
    
    RegisterInstancesWithLoadBalancer : function (LoadBalancerName,RegInstance,callback) {
	params = []
	params.push(["LoadBalancerName", LoadBalancerName]);
        params.push(["Instances.member.InstanceId", RegInstance]);
	ec2_httpclient.queryELB("RegisterInstancesWithLoadBalancer", params, this, true, "onCompleteRegisterInstancesWithLoadBalancer", callback);
    },

    onCompleteRegisterInstancesWithLoadBalancer: function (objResponse) {
        var xmlDoc = objResponse.xmlDoc;
        var items = getNodeValueByName(xmlDoc, "member");
        if (objResponse.callback)
            objResponse.callback(items);
    },
    
    DeregisterInstancesWithLoadBalancer : function (LoadBalancerName,RegInstance,callback) {
	params = []
	params.push(["LoadBalancerName", LoadBalancerName]);
        params.push(["Instances.member.InstanceId", RegInstance]);
	
	ec2_httpclient.queryELB("DeregisterInstancesFromLoadBalancer", params, this, true, "onCompleteDeregisterInstancesWithLoadBalancer", callback);
    },

    onCompleteDeregisterInstancesWithLoadBalancer : function (objResponse) {
        var xmlDoc = objResponse.xmlDoc;
        var items = getNodeValueByName(xmlDoc, "member");
        if (objResponse.callback)
            objResponse.callback(items);
    },
    
    Enableazonewithloadbalancer : function(LoadBalancerName,Zone,callback){
	params = []
	params.push(["LoadBalancerName", LoadBalancerName]);
        params.push(["AvailabilityZones.member.1", Zone]);
	
	ec2_httpclient.queryELB("EnableAvailabilityZonesForLoadBalancer", params, this, true, "onCompleteenableazonewithloadbalancer", callback);
    },
    
    onCompleteenableazonewithloadbalancer: function (objResponse) {
        var xmlDoc = objResponse.xmlDoc;
        var items = getNodeValueByName(xmlDoc, "member");
        if (objResponse.callback)
            objResponse.callback(items);
    },
    
    
    Disableazonewithloadbalancer : function(LoadBalancerName,Zone,callback) {
	params = []
	params.push(["LoadBalancerName", LoadBalancerName]);
        params.push(["AvailabilityZones.member.1", Zone]);
	
	ec2_httpclient.queryELB("DisableAvailabilityZonesForLoadBalancer", params, this, true, "onCompletedisableazonewithloadbalancer", callback);
    },
    
    onCompletedisableazonewithloadbalancer: function (objResponse) {
        var xmlDoc = objResponse.xmlDoc;
        var items = getNodeValueByName(xmlDoc, "member");
        if (objResponse.callback)
            objResponse.callback(items);
    },
    
    
    EditHealthCheck : function(LoadBalancerName,Target,Interval,Timeout,HealthyThreshold,UnhealthyThreshold,callback) {
	var params = []
	params.push(["HealthCheck.Target" , Target]);
	params.push(["LoadBalancerName", LoadBalancerName]);
	params.push(["HealthCheck.Interval", Interval]);
	params.push(["HealthCheck.Timeout", Timeout]);
	params.push(["HealthCheck.HealthyThreshold", HealthyThreshold]);
	params.push(["HealthCheck.UnhealthyThreshold", UnhealthyThreshold]);
       
	ec2_httpclient.queryELB("ConfigureHealthCheck", params, this, true, "onCompleteEditHealthCheck", callback);
    },
    
    onCompleteEditHealthCheck : function(objResponse) {
        var xmlDoc = objResponse.xmlDoc;
        var items = getNodeValueByName(xmlDoc, "HealthCheck");
        if (objResponse.callback)
            objResponse.callback(items);
        
    },
    
    CreateAppCookieSP : function(LoadBalancerName,CookieName,callback) {
       var uniqueid = new Date;
       var id = uniqueid.getTime();
       
       var PolicyName = "AWSConsolePolicy-"+ id;
       params = []
       params.push(["LoadBalancerName", LoadBalancerName]);
       params.push(["CookieName", CookieName]);
       params.push(["PolicyName", PolicyName]);
       ec2_httpclient.queryELB("CreateAppCookieStickinessPolicy", params, this, true, "oncompleteCreateAppCookieSP", callback);
       //no = no + 1;
    },
    
    oncompleteCreateAppCookieSP : function (objResponse) {
        var xmlDoc = objResponse.xmlDoc;
        var items = getNodeValueByName(xmlDoc, "member");
        if (objResponse.callback)
            objResponse.callback(items);
    },
    
    CreateLBCookieSP : function(LoadBalancerName,CookieExpirationPeriod,callback)
    {
       var uniqueid = new Date;
       var id = uniqueid.getTime();
       
       var PolicyName = "AWSConsolePolicy-"+ id; 
       params = []
       params.push(["CookieExpirationPeriod", CookieExpirationPeriod]);
       params.push(["LoadBalancerName", LoadBalancerName]);
       params.push(["PolicyName", PolicyName]);
       ec2_httpclient.queryELB("CreateLBCookieStickinessPolicy", params, this, true, "oncompleteCreateLBCookieSP", callback);   
    },
    
    oncompleteCreateLBCookieSP : function (objResponse) {
        var xmlDoc = objResponse.xmlDoc;
        var items = getNodeValueByName(xmlDoc, "member");
        if (objResponse.callback)
            objResponse.callback(items);
    },
    
    DeleteLoadBalancerPolicy : function(LoadBalancerName,policy,callback)
    {
       params = []
       params.push(["LoadBalancerName", LoadBalancerName]);
       
       params.push(["PolicyName", policy]);
       ec2_httpclient.queryELB("DeleteLoadBalancerPolicy", params, this, true, "oncompleteDeleteLoadBalancerPolicy", callback);   
    },
    
    oncompleteDeleteLoadBalancerPolicy : function (objResponse) {
        var xmlDoc = objResponse.xmlDoc;
        var items = getNodeValueByName(xmlDoc, "member");
        if (objResponse.callback)
            objResponse.callback(items);
    },
    
    uploadservercertificate : function(ServerCertificateName,CertificateBody,PrivateKey,Path,callback){
       params = []
       params.push(["ServerCertificateName", ServerCertificateName]);
       params.push(["CertificateBody", CertificateBody]);
       params.push(["PrivateKey", PrivateKey]);
       if (Path != null) params.push(["Path", Path]);
       ec2_httpclient.queryIAM("UploadServerCertificate", params, this, true, "oncompleteuploadserversertificate", callback);  
    },
    
    oncompleteuploadservercertificate :function(objResponse){
        var xmlDoc = objResponse.xmlDoc;
        var items = getNodeValueByName(xmlDoc, "ServerCertificateMetadata");
        if (objResponse.callback)
            objResponse.callback(items);
        
    },
    
    ListMetrics : function (callback) {
        ec2_httpclient.queryCW("ListMetrics", [], this, true, "onCompleteListMetrics", callback);
    },
    
    onCompleteListMetrics : function (objResponse) {
        var xmlDoc = objResponse.xmlDoc;
        var list = new Array();
	var items = xmlDoc.getElementsByTagName("member");
        for (var i = 0; i < items.length; i++)
        {
	    var Dimensions = items[i].getElementsByTagName("Dimensions");      
            for (var k = 0; k < Dimensions.length; k++)
            {
                var Name = getNodeValueByName(Dimensions[k], "Name");
                var Value = getNodeValueByName(Dimensions[k], "Value");
            }
	    var MeasureName = getNodeValueByName(items[i], "MeasureName");
	    var Namespace = getNodeValueByName(items[i], "Namespace");
	    
	    if(Name == "InstanceId" && Namespace != "" )
	    list.push(new Monitoring(Name,Value, MeasureName,Namespace));

	}
	ec2ui_model.updateMonitoring(list);
        if (objResponse.callback)
            objResponse.callback(list);
    },
    
    GetMetricStatistics : function (starttime,endtime,instance,callback) {
	params = []
        params.push(["MetricName", "CPUUtilization"]);
	params.push(["Namespace", "AWS/EC2"]);
	if (starttime != null){
	   params.push(["StartTime",starttime]); 
	}else{
	   params.push(["StartTime","2011-08-03T21:15:18.000Z"]);
	}
	if (endtime != null){
	   params.push(["EndTime",endtime]); 
	}else{
	   params.push(["EndTime","2011-08-03T22:15:18.000Z"]);
	}
	if(instance != null){
	    params.push(["Dimensions.member.Name", "InstanceId"]);
	    params.push(["Dimensions.member.Value", instance]);
	}
	params.push(["Period", "60"]);
	params.push(["Statistics.member.1", "Average"]);
	params.push(["Unit", "Percent"]);
        ec2_httpclient.queryCW("GetMetricStatistics", params, this, true, "onCompleteGetMetricStatistics", callback);
    },
    
    onCompleteGetMetricStatistics : function (objResponse) {
        var xmlDoc = objResponse.xmlDoc;
        var list = new Array();
	var items = xmlDoc.getElementsByTagName("member");
        for (var i = 0; i < items.length; i++)
        {
	    var Timestamp = getNodeValueByName(items[i],"Timestamp");
	    var Unit = getNodeValueByName(items[i], "Unit");
	    var Average = getNodeValueByName(items[i], "Average");
	    list.push(new Statistics(Timestamp,Unit,Average));
	}
	ec2ui_model.updateMonitoring(list);
        if (objResponse.callback)
            objResponse.callback(list);
    }
};
