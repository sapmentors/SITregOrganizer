sap.ui.define([], function() {
	"use strict";

	return {
		registrationNumbers : function (iMaxParticipants, iParticipants, iFree) {
			if(iMaxParticipants !== null) {
		    	var oResourceBundle = this.getModel("i18n").getResourceBundle();
		    	return oResourceBundle.getText("masterRegistrationNumbers", [iFree, iParticipants, iMaxParticipants]);
			}
		},

		RSVPstatus : function (sValue) {
			var oResourceBundle = this.getModel("i18n").getResourceBundle();
			switch(sValue) {
    			case "Y":
		    		return oResourceBundle.getText("yes");
			    case "N":
		    		return oResourceBundle.getText("no");
			    case "W":
		    		return oResourceBundle.getText("waiting");
			}
		},

		TicketUsed : function (sValue) {
			var oResourceBundle = this.getModel("i18n").getResourceBundle();
			switch(sValue) {
    			case "Y":
		    		return oResourceBundle.getText("yes");
			    case "N":
		    		return oResourceBundle.getText("no");
			    case "M":
		    		return oResourceBundle.getText("manual");
			}
		},

		/**
		 * Rounds the currency value to 2 digits
		 *
		 * @public
		 * @param {string} sValue value to be formatted
		 * @returns {string} formatted currency value with 2 digits
		 */
		currencyValue: function(sValue) {
			if (!sValue) {
				return "";
			}

			return parseFloat(sValue).toFixed(2);
		}
	};

});