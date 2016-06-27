sap.ui.define([
	"sap/m/Text",
	"com/sap/sapmentors/sitreg/events/model/formatter"
], function(Text, formatter) {
	"use strict";

	QUnit.module("formatter - Currency value");

	function currencyValueTestCase(, sValue, fExpectedNumber) {
		// Act
		var fCurrency = formatter.currencyValue(sValue);

		// 

		.strictEqual(fCurrency, fExpectedNumber, "The rounding was correct");
	}

	QUnit.test("Should round down a 3 digit number", function() {
		currencyValueTestCase.call(this, , "3.123", "3.12");
	});

	QUnit.test("Should round up a 3 digit number", function() {
		currencyValueTestCase.call(this, , "3.128", "3.13");
	});

	QUnit.test("Should round a negative number", function() {
		currencyValueTestCase.call(this, , "-3", "-3.00");
	});

	QUnit.test("Should round an empty string", function() {
		currencyValueTestCase.call(this, , "", "");
	});

	QUnit.test("Should round a zero", function() {
		currencyValueTestCase.call(this, , "0", "0.00");
	});

});