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
// @downloadURL https://cdn.jsdelivr.net/gh/CandiceJoy/CandiceJoy-Userscripts/AmiAmi-Refresher.user.js
// @supportURL https://github.com/CandiceJoy/CandiceJoy-Userscripts/issues
// @run-at document-idle
// ==/UserScript==
( function (): void
{
	"use strict";
	//--== User Editable ==--
	const currency = "usd";
	const refreshSeconds = 15; //seconds
	//--== End User Editable ==--

	const buttonSelector = "button.btn-cart[style=\"\"]";
	const priceSelector = ".item-detail__price_selling-price";

	const priceThreshold = 10000;
	const refreshTimer: number = refreshSeconds * 1000;

	const timeout: NodeJS.Timeout = setTimeout( function ()
	                                            {
		                                            location.reload();
	                                            }, refreshTimer );

	function jancodeLink(): boolean
	{
		//console.log(nodes);
		const ele: JQuery = $( document )
			.find( ".item-about__data :contains('JAN code')" )
			.next( ".item-about__data-text" );

		if ( ele.length > 0 )
		{
			const jancode: string = ele.text();

			if ( jancode !== undefined && jancode !== null && jancode.trim() !== "" )
			{
				const url = `https://myfigurecollection.net/browse.v4.php?keywords=${jancode}`;
				$( ele ).html( `<a href="javascript: window.open('${url}', '_blank').focus();">${jancode}</a>` );
				return true;
			}
		}

		return false;
	}

	function getPrice(): number
	{
		return parseInt( $( priceSelector ).text().replace( "JPY", "" ).replace( ",", "" ) );
	}

	function cartButton(): boolean
	{
		const cartButton: JQuery = $( document ).find( buttonSelector );

		if ( cartButton !== undefined && cartButton !== null )
		{
			if ( getPrice() > priceThreshold )
			{
				clearTimeout( timeout );
				console.log( "Price too high, not auto-clicking" );
			}
			else
			{
				console.log( "CLICK" );
				$( cartButton ).click();
			}

			return true;
		}

		return false;
	}

	function currencyConversion(): void
	{
		$.ajax( `https://cdn.jsdelivr.net/gh/fawazahmed0/currency-api@1/latest/currencies/jpy/${currency}.json` )
		 .always( function ( data )
		          {
					  const result: string|undefined = $( data ).attr( currency );
			          let conversionFactor: string;

					  if( result )
					  {
						  conversionFactor = result;
					  }
					  else
					  {
						  return;
					  }

			          const newPrice: number = parseFloat( conversionFactor ) * getPrice();
			          const formatter: Intl.NumberFormat = new Intl.NumberFormat( "en-US", {
				          style: "currency", currency: currency.toUpperCase()
			          } );
			          const finalPrice: string = formatter.format( newPrice );

			          if ( finalPrice !== undefined )
			          {
				          $( document ).find( ".item-detail__price_selling-price" ).text( finalPrice );
			          }
		          } );
	}

	const observerConfig: object = {
		childList: true, subtree: true, attributes: true
	};

	function observerFunc( mutations: MutationRecord[] ): void
	{
		let done1 = false;
		let done2 = false;

		mutations.forEach( () =>
		                   {
			                   if ( done1 && done2 )
			                   {
				                   return;
			                   }

			                   if ( !done1 )
			                   {
				                   done1 = jancodeLink();
			                   }
			                   if ( !done2 )
			                   {
				                   done2 = cartButton();
			                   }

			                   if ( done1 && done2 )
			                   {
				                   currencyConversion();
				                   observer.disconnect();
			                   }
		                   } );
	}

	const observer: MutationObserver = new MutationObserver( observerFunc );

	( function (): void
	{
		const body: HTMLBodyElement | null = document.querySelector( "body" );

		if ( body !== null )
		{
			observer.observe( body, observerConfig );
		}
	} )();
} )();
