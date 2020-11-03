/*global location */
sap.ui.define([
	"com/sap/sapmentors/sitreg/events/controller/BaseController",
	"sap/ui/model/json/JSONModel",
	"com/sap/sapmentors/sitreg/events/model/formatter",
	"sap/m/MessageBox",
	"sap/m/MessageToast"
], 
/**
 * @param {typeof com.sap.sapmentors.sitreg.events.controller.BaseController} BaseController
 */
function(BaseController, JSONModel, formatter, MessageBox, MessageToast) {
	"use strict";

	return BaseController.extend("com.sap.sapmentors.sitreg.events.controller.Detail", {

		formatter: formatter,
		_oDialog: null,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit: function() {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			this._oViewModel = new JSONModel({
				busy: false,
				enableCreateCoOrganizer: false,
				enableCreateDevice: false,
				hasEditAuthorityCoOrganizer: false,
				delay: 0
			});

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
			this.setModel(this._oViewModel, "detailView");
			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));
			this._oODataModel = this.getOwnerComponent().getModel();
			this._oResourceBundle = this.getResourceBundle();
			this._oViewModel.setProperty("/hasEditAuthorityCoOrganizer", this.hasEditAuthorization());

			this.mGroupFunctions = {
				RSVP: function(oContext) {
					var name = oContext.getProperty("RSVP");
					return {
						key: name,
						text: name
					};
				}
			};			
		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */
		onShareEmailPress: function() {
			var oViewModel = this.getModel("detailView");

			sap.m.URLHelper.triggerEmail(
				null,
				oViewModel.getProperty("/shareSendEmailSubject"),
				oViewModel.getProperty("/shareSendEmailMessage")
			);
		},

		/**
		 * Event handler when the share in JAM button has been clicked
		 * @public
		 */
		onShareInJamPress: function() {
			var oViewModel = this.getModel("detailView"),
				oShareDialog = sap.ui.getCore().createComponent({
					name: "sap.collaboration.components.fiori.sharing.dialog",
					settings: {
						object: {
							id: location.href,
							share: oViewModel.getProperty("/shareOnJamTitle")
						}
					}
				});

			oShareDialog.open();
		},

		/**
		 * Event handler (attached declaratively) for the view delete button. Deletes the selected item. 
		 * @function
		 * @public
		 */
		onDelete: function() {
			var that = this;
			var oViewModel = this.getModel("detailView"),
				sPath = oViewModel.getProperty("/sObjectPath"),
				sObjectHeader = this._oODataModel.getProperty(sPath + "/Location"),
				sQuestion = this._oResourceBundle.getText("deleteText", sObjectHeader),
				sSuccessMessage = this._oResourceBundle.getText("deleteSuccess", sObjectHeader);

			var fnMyAfterDeleted = function() {
				MessageToast.show(sSuccessMessage);
				oViewModel.setProperty("/busy", false);
				var oNextItemToSelect = that.getOwnerComponent().oListSelector.findNextItem(sPath);
				that.getModel("appView").setProperty("/itemToSelect", oNextItemToSelect.getBindingContext().getPath()); //save last deleted
			};
			this._confirmDeletionByUser({
				question: sQuestion
			}, [sPath], fnMyAfterDeleted);
		},

		/**
		 * Event handler (attached declaratively) for the view edit button. Open a view to enable the user update the selected item. 
		 * @function
		 * @public
		 */
		onEdit: function() {
			this.getModel("appView").setProperty("/addEnabled", false);
			var sObjectPath = this.getView().getElementBinding().getPath();
			this.getRouter().getTargets().display("create", {
				mode: "update",
				objectPath: sObjectPath
			});
		},
		/**
		 * Event handler for the view save co-organizer button. Create entry in model and save data. 
		 * @function
		 * @public
		 */
		onSaveCoOrganizer: function(oEvent) {
			var oViewModel = this.getModel("detailView"),
				sPath = oViewModel.getProperty("/sObjectPath"),
				sID = this._oODataModel.getProperty(sPath + "/ID");
			var sUserName = this.byId("UserName_id").getValue();
			// create entry properties
			var oEntry = {
				EventID: sID,
				UserName: sUserName,
				Active: "Y"
			};
			this._oODataModel.createEntry("/CoOrganizers", {
				properties: oEntry
			});
			this._oODataModel.submitChanges({
				success: this._onSaveCoOrganizerSuccess.bind(this),
				error: this._onSaveCoOrganizerError.bind(this)
			});
		},

		/**
		 * Event handler for the view save device button.
		 * Create entry in model and save data. 
		 * @function
		 * @public
		 */
		onSaveDevice: function(oEvent) {
			var oViewModel = this.getModel("detailView"),
				sPath = oViewModel.getProperty("/sObjectPath"),
				sID = this._oODataModel.getProperty(sPath + "/ID");
			var sDeviceID = this.byId("Device_id").getValue();
			// create entry properties
			var oEntry = {
				EventID: sID,
				DeviceID: sDeviceID,
				Active: "Y"
			};
			this._oODataModel.createEntry("/Devices", {
				properties: oEntry
			});
			this._oODataModel.submitChanges({
				success: this._onSaveDeviceSuccess.bind(this),
				error: this._onSaveDeviceError.bind(this)
			});
		},
		/**
		 * Event handler for the view export partipicants as excel. 
		 * @function
		 * @public
		 */
		onDataExport: function(oEvent) {
			var odxlServiceEndpoint = "/destinations/HANAMDC/system-local/public/rbouman/odxl/service/odxl.xsjs/";
			var oViewModel = this.getModel("detailView"),
				sPath = oViewModel.getProperty("/sObjectPath"),
				sID = this._oODataModel.getProperty(sPath + "/ID");
			var sServiceUrl = '"SITREG"/"com.sap.sapmentors.sitreg.odataorganizer.procedures::ParticipantsRead"';
			var filter = '?$filter="EventID" eq' + sID;
			var odataQuery = sServiceUrl + filter;
			var sUrl = odxlServiceEndpoint + odataQuery;
			var extension = "xlsx";
			var fileName = 'Participants' + "." + extension;
			var encodeUrl = encodeURI(sUrl + "&$format=" + extension + "&download=" + fileName);
			sap.m.URLHelper.redirect(encodeUrl, true);
			// var downloadSheetLink = this.byId('exportXslx');
			// var sHref = sUrl + "&$format=" + extension + "&download=" + fileName;
			// downloadSheetLink.setHref(sHref);
			// downloadSheetLink.download = fileName;
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		/**
		 * Checks for a condition whether Co-Organizers have edit authority or not
		 * @function
		 * @public
		 */
		hasEditAuthorization: function() {
			/*var hasAuth = this.History.CreatedBy === //this.getModel("currentUser").getProperty("/name");*/
			var hasAuth = true;
			return hasAuth;
		},

		handleViewSettingsDialogButtonPressed: function (oEvent) {
			if (!this._oDialog) {
				this._oDialog = sap.ui.xmlfragment(
									"com.sap.sapmentors.sitreg.events.view.ParticipantsTableDialog", 
									this
								);
			}
			// toggle compact style
			jQuery.sap.syncStyleClass("sapUiSizeCompact", this.getView(), this._oDialog);
			this.getView().addDependent(this._oDialog);
			this._oDialog.open();
		},

		handleConfirm: function(oEvent) {
 
			var oView = this.getView();
			var oTable = oView.byId("idPartipicantsTable");
 
			var mParams = oEvent.getParameters();
			var oBinding = oTable.getBinding("items");
 
			// apply sorter to binding
			// (grouping comes before sorting)
			var aSorters = [];
			var sPath;
			var bDescending;
			if (mParams.groupItem) {
				sPath = mParams.groupItem.getKey();
				bDescending = mParams.groupDescending;
				var vGroup = this.mGroupFunctions[sPath];
				aSorters.push(new sap.ui.model.Sorter(sPath, bDescending, vGroup));
			}
			sPath = mParams.sortItem.getKey();
			bDescending = mParams.sortDescending;
			aSorters.push(new sap.ui.model.Sorter(sPath, bDescending));
			oBinding.sort(aSorters);
		},
		
		onExit : function () {
			if (this._oDialog) {
				this._oDialog.destroy();
			}
		},

		_onSaveCoOrganizerSuccess: function(oData) {
			this.byId("UserName_id").setValue(null);
			var sMessage = this.getResourceBundle().getText("onSaveCoOrganizerSuccess");
			MessageToast.show(sMessage);
		},
		_onSaveCoOrganizerError: function(oError) {
			var sMessage = this.getResourceBundle().getText("onSaveCoOrganizerError");
			MessageToast.show(sMessage);
		},

		_onSaveDeviceSuccess: function(oData) {
			this.byId("Device_id").setValue(null);
			var sMessage = this.getResourceBundle().getText("onSaveDeviceSuccess");
			MessageToast.show(sMessage);
		},
		_onSaveDeviceError: function(oError) {
			var sMessage = this.getResourceBundle().getText("onSaveDeviceError");
			MessageToast.show(sMessage);
		},		
		/**
		 * Checks if the save button for the CoOrganizer can be enabled
		 * @private
		 */
		_validateSaveEnablementCoOrganizer: function() {
			var aInputControls = this._getFormFields(this.byId("newCoOrganizerSimpleForm"));
			var oControl;
			for (var m = 0; m < aInputControls.length; m++) {
				oControl = aInputControls[m].control;
				if (aInputControls[m].required) {
					var sValue = oControl.getValue();
					if (!sValue) {
						this._oViewModel.setProperty("/enableCreateCoOrganizer", false);
						return;
					} else {
						this._oViewModel.setProperty("/enableCreateCoOrganizer", true);
					}
				}
			}
		},
		/**
		 * Checks if the save button for the Device can be enabled
		 * @private
		 */
		_validateSaveEnablementDevice: function() {
			var aInputControls = this._getFormFields(this.byId("newDevicesForm"));
			var oControl;
			for (var m = 0; m < aInputControls.length; m++) {
				oControl = aInputControls[m].control;
				if (aInputControls[m].required) {
					var sValue = oControl.getValue();
					if (!sValue) {
						this._oViewModel.setProperty("/enableCreateDevice", false);
						return;
					} else {
						this._oViewModel.setProperty("/enableCreateDevice", true);
					}
				}
			}
		},		
		/**
		 * Binds the view to the object path and expands the aggregated line items.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function(oEvent) {
			var oParameter = oEvent.getParameter("arguments");
			for (var value in oParameter) {
				oParameter[value] = decodeURIComponent(oParameter[value]);
			}
			this.getModel().metadataLoaded().then(function() {
				var sObjectPath = this.getModel().createKey("Events", oParameter);
				this._bindView("/" + sObjectPath, {expand: "EventChangeable,RegistrationNumbers,PrePostEveningEventNumbers,ParticipantNumbers,EventType"} );
			}.bind(this));
		},

		/**
		 * Binds the view to the object path. Makes sure that detail view displays
		 * a busy indicator while data for the corresponding element binding is loaded.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound to the view.
		 * @private
		 */
		_bindView: function(sObjectPath, oParameters) {
			// Set busy indicator during view binding
			var oViewModel = this.getModel("detailView");

			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);

			this.getView().bindElement({
				path: sObjectPath,
				parameters: oParameters,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function() {
						oViewModel.setProperty("/busy", true);
					},
					dataReceived: function() {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},

		/**
		 * Event handler for binding change event
		 * @function
		 * @private
		 */
		_getFileName: function(extension, name) {
			var fileName;
			fileName = name;
			return fileName + "." + extension;
		},

		_onBindingChange: function() {
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding(),
				oViewModel = this.getModel("detailView"),
				oAppViewModel = this.getModel("appView");

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailObjectNotFound");
				// if object could not be found, the selection in the master list
				// does not make sense anymore.
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
				return;
			}

			var sPath = oElementBinding.getBoundContext().getPath(),
				oResourceBundle = this.getResourceBundle(),
				oObject = oView.getModel().getObject(sPath),
				sObjectId = oObject.ID,
				sObjectName = oObject.Location;

			oViewModel.setProperty("/sObjectId", sObjectId);
			oViewModel.setProperty("/sObjectPath", sPath);
			oAppViewModel.setProperty("/itemToSelect", sPath);
			this.getOwnerComponent().oListSelector.selectAListItem(sPath);

			oViewModel.setProperty("/saveAsTileTitle", oResourceBundle.getText("shareSaveTileAppTitle", [sObjectName]));
			oViewModel.setProperty("/shareOnJamTitle", sObjectName);
			oViewModel.setProperty("/shareSendEmailSubject",
				oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			oViewModel.setProperty("/shareSendEmailMessage",
				oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
		},

		/**
		 * Event handler for metadata loaded event
		 * @function
		 * @private
		 */

		_onMetadataLoaded: function() {
			// Store original busy indicator delay for the detail view
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("detailView");

			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/delay", 0);

			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/busy", true);
			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
		},

		/**
		 * Opens a dialog letting the user either confirm or cancel the deletion of a list of entities
		 * @param {object} oConfirmation - Possesses up to two attributes: question (obligatory) is a string providing the statement presented to the user.
		 * title (optional) may be a string defining the title of the popup.
		 * @param {object} oConfirmation - Possesses up to two attributes: question (obligatory) is a string providing the statement presented to the user.
		 * @param {array} aPaths -  Array of strings representing the context paths to the entities to be deleted. Currently only one is supported.
		 * @param {callback} fnAfterDeleted (optional) - called after deletion is done. 
		 * @param {callback} fnDeleteCanceled (optional) - called when the user decides not to perform the deletion
		 * @param {callback} fnDeleteConfirmed (optional) - called when the user decides to perform the deletion. A Promise will be passed
		 * @function
		 * @private
		 */
		/* eslint-disable */ // using more then 4 parameters for a function is justified here
		_confirmDeletionByUser: function(oConfirmation, aPaths, fnAfterDeleted, fnDeleteCanceled, fnDeleteConfirmed) {
			/* eslint-enable */
			// Callback function for when the user decides to perform the deletion
			var fnDelete = function() {
				// Calls the oData Delete service
				this._callDelete(aPaths, fnAfterDeleted);
			}.bind(this);

			// Opens the confirmation dialog
			MessageBox.show(oConfirmation.question, {
				icon: oConfirmation.icon || MessageBox.Icon.WARNING,
				title: oConfirmation.title || this._oResourceBundle.getText("delete"),
				actions: [MessageBox.Action.OK, MessageBox.Action.CANCEL],
				onClose: function(oAction) {
					if (oAction === MessageBox.Action.OK) {
						fnDelete();
					} else if (fnDeleteCanceled) {
						fnDeleteCanceled();
					}
				}
			});
		},

		/**
		 * Performs the deletion of a list of entities.
		 * @param {array} aPaths -  Array of strings representing the context paths to the entities to be deleted. Currently only one is supported.
		 * @param {callback} fnAfterDeleted (optional) - called after deletion is done. 
		 * @return a Promise that will be resolved as soon as the deletion process ended successfully.
		 * @function
		 * @private
		 */
		_callDelete: function(aPaths, fnAfterDeleted) {
			var oViewModel = this.getModel("detailView");
			oViewModel.setProperty("/busy", true);
			var fnFailed = function() {
				this._oODataModel.setUseBatch(true);
			}.bind(this);
			var fnSuccess = function() {
				if (fnAfterDeleted) {
					fnAfterDeleted();
					this._oODataModel.setUseBatch(true);
				}
				oViewModel.setProperty("/busy", false);
			}.bind(this);
			return this._deleteOneEntity(aPaths[0], fnSuccess, fnFailed);
		},

		/**
		 * Deletes the entity from the odata model
		 * @param {array} aPaths -  Array of strings representing the context paths to the entities to be deleted. Currently only one is supported.
		 * @param {callback} fnSuccess - Event handler for success operation.
		 * @param {callback} fnFailed - Event handler for failure operation.
		 * @function
		 * @private
		 */
		_deleteOneEntity: function(sPath, fnSuccess, fnFailed) {
			var oPromise = new Promise(function(fnResolve, fnReject) {
				this._oODataModel.setUseBatch(false);
				this._oODataModel.remove(sPath, {
					success: fnResolve,
					error: fnReject,
					async: true
				});
			}.bind(this));
			oPromise.then(fnSuccess, fnFailed);
			return oPromise;
		}

	});
});