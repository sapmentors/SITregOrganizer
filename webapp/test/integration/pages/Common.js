sap.ui.define([
	"sap/ui/test/Opa5"
], function(Opa5) {
	"use strict";

	function getFrameUrl(sHash, sUrlParameters) {
		var sUrl = jQuery.sap.getResourcePath("com/sap/sapmentors/sitreg/events/app", ".html");
		sHash = sHash || "";
		sUrlParameters = sUrlParameters ? "?" + sUrlParameters : "";

		if (sHash) {
			sHash = "#SITEvents-display&/" + (sHash.indexOf("/") === 0 ? sHash.substring(1) : sHash);
		} else {
			sHash = "#SITEvents-display";
		}

		return sUrl + sUrlParameters + sHash;
	}

	return Opa5.extend("com.sap.sapmentors.sitreg.events.test.integration.pages.Common", {

		iStartTheApp: function(oOptions) {
			oOptions = oOptions || {};
			// Start the app with a minimal delay to make tests run fast but still async to discover basic timing issues
			this.iStartMyAppInAFrame(getFrameUrl(oOptions.hash, "serverDelay=50"));
		},

		iStartTheAppWithDelay: function(sHash, iDelay) {
			this.iStartMyAppInAFrame(getFrameUrl(sHash, "serverDelay=" + iDelay));
		},

		iLookAtTheScreen: function() {
			return this;
		},

		iStartMyAppOnADesktopToTestErrorHandler: function(sParam) {
			this.iStartMyAppInAFrame(getFrameUrl("", sParam));
		},

		createAWaitForAnEntitySet: function(oOptions) {
			return {
				success: function() {
					var bMockServerAvailable = false,
						aEntitySet;

					this.getMockServer().then(function(oMockServer) {
						aEntitySet = oMockServer.getEntitySetData(oOptions.entitySet);
						bMockServerAvailable = true;
					});

					return this.waitFor({
						check: function() {
							return bMockServerAvailable;
						},
						success: function() {
							oOptions.success.call(this, aEntitySet);
						}
					});
				}
			};
		},

		getMockServer: function() {
			return new Promise(function(success) {
				Opa5.getWindow().sap.ui.require(["com/sap/sapmentors/sitreg/events/localService/mockserver"], function(mockserver) {
					success(mockserver.getMockServer());
				});
			});
		}

	});

});