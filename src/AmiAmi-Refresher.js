// ==UserScript==
// @name         AmiAmi Refresher
// @namespace    http://candicejoy.com/
// @version      1.1
// @description  AmiAmi Refresher / Auto-Add-To-Cart
// @author       CandiceJoy
// @match        https://www.amiami.com/eng/detail/*
// @icon         https://www.google.com/s2/favicons?domain=amiami.com
// @grant        none
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// @if BUILD_TYPE="Mac"
// @require file:///Users/candice/WebstormProjects/CandiceJoy-Userscripts/AmiAmi-Refresher.user.js
// @endif
// @if BUILD_TYPE="PC"
// @require file://c:/Users/candice/WebstormProjects/CandiceJoy-Userscripts/AmiAmi-Refresher.user.js
// @endif
// @if BUILD_TYPE="Prod"
// @downloadURL https://cdn.jsdelivr.net/gh/CandiceJoy/CandiceJoy-Userscripts/AmiAmi-Refresher.user.js
// @supportURL https://github.com/CandiceJoy/CandiceJoy-Userscripts/issues
// @endif
// @run-at document-idle
// ==/UserScript==
// @if BUILD_TYPE="Prod"
/*jshint esversion: 8 */

//--== User Editable ==--
const currency = "usd";
const refreshSeconds = 15; //seconds
//--== End User Editable ==--

const observerConfig = {
	childList: true, subtree: true, attributes: true
};

const buttonSelector = 'button.btn-cart[style=""]';
const priceSelector = '.item-detail__price_selling-price';
const observer = new MutationObserver(observerFunc);
const buyText = "add to cart";

const priceThreshold = 10000;
const refreshTimer = refreshSeconds * 1000;

const timeout = setTimeout(function()
                           {
	                           location.reload();
                           }, refreshTimer);

(function()
{
	'use strict';

	observer.observe(document.querySelector("body"), observerConfig);
})();

function jancodeLink()
{
	//console.log(nodes);
	var ele = $(document).find(".item-about__data :contains('JAN code')").next(".item-about__data-text");

	if(ele.length > 0)
	{
		var jancode = ele.text();

		if(jancode !== undefined && jancode !== null && jancode.trim() !== "")
		{
			var url = `https://myfigurecollection.net/browse.v4.php?keywords=${jancode}`;
			$(ele).html(`<a href="javascript: window.open('${url}', '_blank').focus();">${jancode}</a>`);
			return true;
		}
	}

	return false;
}

function getPrice()
{
	return parseInt($(priceSelector).text().replace("JPY", "").replace(",", ""));
}

function cartButton()
{
	var cartButton = $(document).find(buttonSelector);

	if(cartButton !== undefined && cartButton !== null)
	{
		if(getPrice() > priceThreshold)
		{
			clearTimeout(timeout);
			console.log("Price too high, not auto-clicking");
		}
		else
		{
			console.log("CLICK");
			$(cartButton).click();
		}

		return true;
	}

	return false;
}

function currencyConversion()
{
	$.ajax("https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/jpy/" + currency + ".json")
	 .always(function(data)
	         {
		         var conversionFactor = $(data).attr(currency);
		         var newPrice = parseFloat(conversionFactor) * getPrice();
		         var formatter = new Intl.NumberFormat('en-US', {
			         style: 'currency', currency: currency.toUpperCase()
		         });
		         var finalPrice = formatter.format(newPrice);

		         if(finalPrice != undefined)
		         {
			         $(document).find(".item-detail__price_selling-price").text(finalPrice);
		         }
	         });
}

function observerFunc(mutations)
{
	var done1 = false;
	var done2 = false;

	mutations.forEach(() =>
	                  {
		                  if(done1 && done2)
		                  {
			                  return;
		                  }

		                  if(!done1)
		                  {
			                  done1 = jancodeLink();
		                  }
		                  if(!done2)
		                  {
			                  done2 = cartButton();
		                  }

		                  if(done1 && done2)
		                  {
			                  currencyConversion();
			                  observer.disconnect();
		                  }
	                  });
}

// @endif