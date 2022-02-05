// ==UserScript==
// @name         AmiAmi Waiter
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://www.amiami.com/eng/detail/*
// @icon         https://www.google.com/s2/favicons?domain=userscript.zone
// @grant        none
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// @run-at document-idle
// ==/UserScript==

//TODO: Currency Conversion?
//TODO: Price check before auto-click?


const observerConfig = {
	childList: true, subtree: true, attributes: true
};

const buttonSelector = 'button.btn-cart[style=""]';
const priceSelector = '.item-detail__price_selling-price';
const observer = new MutationObserver(observerFunc);
const buyText = "add to cart";
const refreshSeconds = 10; //seconds
const priceThreshold = 10000;
const refreshTimer = refreshSeconds * 1000;
/*const timeout = setTimeout(function()
 {
 location.reload();
 }, refreshTimer);*/

(function()
{
	'use strict';

	observer.observe(document.querySelector("body"), observerConfig);
})();

function jancodeLink(nodes)
{
	var ele = $(nodes).find(".item-about__data :contains('JAN code')").next(".item-about__data-text");

	if(ele.length > 0)
	{
		var jancode = ele.text();
		console.log($(nodes).find(".item-about__data :contains('JAN code')").parent().html());
		console.log(ele);
		console.log(jancode);

		//var ele = document.querySelector(
		//"#__layout > div > div.pc-wrapper > div:nth-child(2) > div > div > div > div > div > section:nth-child(2) > dl:nth-child(3) > dd:nth-child(4)");
		//var jancode = $(ele).text();

		if(jancode !== undefined && jancode !== null && jancode.trim() !== "")
		{

			var url = `https://myfigurecollection.net/browse.v4.php?keywords=${jancode}`;

			ele.innerHTML = `<a href="javascript:void(0)">${jancode}</a>`;
			$(ele).on("click", function()
			{
				window.open(url, '_blank').focus();
			});
		}
	}
}

function cartButton(nodes)
{
	var cartButton = $(mutation.addedNodes).find(buttonSelector);

	if(cartButton !== undefined && cartButton !== null)
	{
		var price = parseInt($(priceSelector).text().replace("JPY", "").replace(",", ""));

		if(price > priceThreshold)
		{
			//clearTimeout(timeout);
			console.log("Price too high, not auto-clicking");
		}
		else
		{
			$(cartButton).click();
		}
	}
}

function observerFunc(mutations)
{
	mutations.forEach((mutation) =>
	                  {
		                  var nodes = mutation.addedNodes;
		                  //observer.disconnect();

		                  jancodeLink(nodes);

		                  cartButton(nodes);
	                  });
}

