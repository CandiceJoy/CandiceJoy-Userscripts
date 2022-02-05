// ==UserScript==
// @name         BuyFriend Redirect
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  try to take over the world!
// @author       CandiceJoy
// @match        https://buyfriend.moe/search?search=https://www.amiami.com/eng/detail/?*
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=amiami.com
// @grant        none
// ==/UserScript==

const logo = "amiamilogo.png";

(function()
{
	'use strict';
	$("a img").each(function()
	                {
		                if($(this).attr("src").includes(logo))
		                {
			                $(this).click();
		                }
	                });

	$("h3 a").each(function()
	               {
		               location.href = $(this).attr("href");
	               });
})();
