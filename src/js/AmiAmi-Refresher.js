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
"use strict";
//--== User Editable ==--
const AmiAmiRefresher = {};
AmiAmiRefresher.currency = "usd";
AmiAmiRefresher.refreshSeconds = 15; //seconds
//--== End User Editable ==--

AmiAmiRefresher.observerConfig = {
	childList: true, subtree: true, attributes: true
};

AmiAmiRefresher.buttonSelector = 'button.btn-cart[style=""]';
AmiAmiRefresher.priceSelector = '.item-detail__price_selling-price';
AmiAmiRefresher.observer = new MutationObserver(AmiAmiRefresher.observerFunc);
//const buyText = "add to cart";

AmiAmiRefresher.priceThreshold = 10000;
AmiAmiRefresher.refreshTimer = AmiAmiRefresher.refreshSeconds * 1000;

AmiAmiRefresher.timeout = setTimeout(function()
                                     {
	                                     location.reload();
                                     }, AmiAmiRefresher.refreshTimer);

AmiAmiRefresher.main = function()
{
	let body = document.querySelector("body");

	if(body)
	{
		AmiAmiRefresher.observer.observe(body, AmiAmiRefresher.observerConfig);
	}
	else
	{
		throw "Cannot find body?!";
	}
};

AmiAmiRefresher.jancodeLink = function()
{
	//console.log(nodes);
	let ele = $(document).find(".item-about__data :contains('JAN code')").next(".item-about__data-text");

	if(ele.length > 0)
	{
		let jancode = ele.text();

		if(jancode !== undefined && jancode !== null && jancode.trim() !== "")
		{
			let url = `https://myfigurecollection.net/browse.v4.php?keywords=${jancode}`;
			$(ele).html(`<a href="javascript: window.open('${url}', '_blank').focus();">${jancode}</a>`);
			return true;
		}
	}

	return false;
};

AmiAmiRefresher.getPrice = function()
{
	return parseInt($(AmiAmiRefresher.priceSelector).text().replace("JPY", "").replace(",", ""));
};

AmiAmiRefresher.cartButton = function()
{
	let cartButton = $(document).find(AmiAmiRefresher.buttonSelector);

	if(cartButton !== undefined && cartButton !== null)
	{
		if(AmiAmiRefresher.getPrice() > AmiAmiRefresher.priceThreshold)
		{
			clearTimeout(AmiAmiRefresher.timeout);
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
};

AmiAmiRefresher.currencyConversion = function()
{
	$.ajax("https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/jpy/" + AmiAmiRefresher.currency + ".json")
	 .always(function(data)
	         {
		         let conversionFactor = $(data).attr(AmiAmiRefresher.currency);
		         let newPrice = parseFloat(conversionFactor) * AmiAmiRefresher.getPrice();
		         let formatter = new Intl.NumberFormat('en-US', {
			         style: 'currency', currency: AmiAmiRefresher.currency.toUpperCase()
		         });
		         let finalPrice = formatter.format(newPrice);

		         if(finalPrice !== undefined)
		         {
			         $(document).find(".item-detail__price_selling-price").text(finalPrice);
		         }
	         });
};

AmiAmiRefresher.observerFunc = function(/** @type {any[]} */ mutations)
{
	let done1 = false;
	let done2 = false;

	mutations.forEach(() =>
	                  {
		                  if(done1 && done2)
		                  {
			                  return;
		                  }

		                  if(!done1)
		                  {
			                  done1 = AmiAmiRefresher.jancodeLink();
		                  }
		                  if(!done2)
		                  {
			                  done2 = AmiAmiRefresher.cartButton();
		                  }

		                  if(done1 && done2)
		                  {
			                  AmiAmiRefresher.currencyConversion();
			                  AmiAmiRefresher.observer.disconnect();
		                  }
	                  });
};
AmiAmiRefresher.main();
// @endif