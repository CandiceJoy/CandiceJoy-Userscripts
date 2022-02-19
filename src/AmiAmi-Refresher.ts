// ==UserScript==
// @name         AmiAmi Refresher
// @namespace    http://candicejoy.com/
// @version      1.4
// @description  AmiAmi Refresher / Auto-Add-To-Cart
// @author       CandiceJoy
// @match        https://www.amiami.com/eng/detail/*
// @icon         https://www.google.com/s2/favicons?domain=amiami.com
// @grant        none
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// @downloadURL https://cdn.jsdelivr.net/gh/CandiceJoy/CandiceJoy-Userscripts/AmiAmi-Refresher.user.js
// @supportURL https://github.com/CandiceJoy/CandiceJoy-Userscripts/issues
// @run-at document-idle
// ==/UserScript==
(function(): void
{
	"use strict";
	//--== User Editable ==--
	const currency: string = "usd";
	const refreshSeconds: number = 1500; //seconds
	//--== End User Editable ==--

	const buttonSelector: string = ".btn-cart:not([style]), .btn-cart[style='']";
	const priceSelector: string = ".item-detail__price_selling-price";

	const priceThreshold: number = 10000;
	const refreshTimer: number = refreshSeconds * 1000;

	const timeout: NodeJS.Timeout = setTimeout(function(): void
	                                           {
		                                           location.reload();
	                                           }, refreshTimer);


	const observer: MutationObserver = new MutationObserver(observerFunc);
	const body: HTMLBodyElement | null = document.querySelector("body");

	const observerConfig: object = {
		childList : true,
		subtree   : true,
		attributes: true
	};

	if(body !== null)
	{
		observer.observe(body, observerConfig);
	}

	function jancodeLink(): boolean
	{
		const ele: JQuery = $(document)
			.find(".item-about__data :contains('JAN code')")
			.next(".item-about__data-text");

		if(ele.length > 0)
		{
			const jancode: string = ele.text();

			if(jancode && jancode.trim() !== "")
			{
				const url: string = `https://myfigurecollection.net/browse.v4.php?keywords=${jancode}`;
				ele.empty();
				ele.append(`<a href="javascript: window.open('${url}', '_blank').focus();">${jancode}</a>`);
				return true;
			}
			else
			{
				return false;
			}
		}

		return false;
	}

	function getPrice(): number
	{
		return parseInt($(priceSelector).text().replace("JPY", "").replace(",", ""));
	}

	function cartButton(): boolean
	{
		//debugger;
		const cartButton: JQuery = $(document).find(buttonSelector);
		let done: boolean = false;

		cartButton.each(function(): void
		                   {
			                   const text: string = $(this).text();

			                   if(text.toLowerCase().includes("cart"))
			                   {
				                   if(getPrice() > priceThreshold)
				                   {
					                   clearTimeout(timeout);
					                   console.log("Price too high, not auto-clicking");
				                   }
				                   else
				                   {
					                   console.log("CLICK");
					                   $(cartButton).trigger("click");
				                   }
			                   }

							   done = true;
		                   });

		return done;
	}

	function currencyConversion(): void
	{
		$.ajax(`https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/jpy/${currency}.json`)
		 .always(function(data: any): void
		         {
			         const result: string | undefined = $(data).attr(currency);
			         let conversionFactor: string;

			         if(result)
			         {
				         conversionFactor = result;
			         }
			         else
			         {
				         return;
			         }

			         const newPrice: number = parseFloat(conversionFactor) * getPrice();
			         const formatter: Intl.NumberFormat = new Intl.NumberFormat("en-US", {
				         style   : "currency",
				         currency: currency.toUpperCase()
			         });
			         const finalPrice: string = formatter.format(newPrice);

			         if(finalPrice !== undefined)
			         {
				         $(document).find(".item-detail__price_selling-price").text(finalPrice);
			         }
		         });
	}

	let done1: boolean = false;
	let done2: boolean = false;

	function observerFunc(mutations: MutationRecord[]): void
	{
		mutations.forEach((): void =>
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
})();
