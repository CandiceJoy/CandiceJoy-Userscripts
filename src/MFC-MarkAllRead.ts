// ==UserScript==
// @name         MFC Mark All As Read
// @namespace    http://candicejoy.com/
// @version      1.1
// @description  Adds a Mark All Read button to MFC Notifications Page
// @author       CandiceJoy
// @match        https://myfigurecollection.net/notifications/*
// @icon         https://static.myfigurecollection.net/ressources/assets/webicon.png
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// @if BUILD_TYPE="Dev"
// @require file:///* @echo PATH*/MFC-MarkAllRead.user.js
// @endif
// @if BUILD_TYPE="Prod"
// @downloadURL https://cdn.jsdelivr.net/gh/CandiceJoy/CandiceJoy-Userscripts/MFC-MarkAllRead.user.js
// @supportURL https://github.com/CandiceJoy/CandiceJoy-Userscripts/issues
// @endif
// @grant        none
// ==/UserScript==
/// <reference types="react-dom/server" />
// @if BUILD_TYPE="Prod"
(function(): void
{
	"use strict";

	const headerSelector: string = "#main";
	const activitySelector: string = ".activity-wrapper";
	const iconSelector: string = ".icon-bell-slash";

	(function(): void
	{
		const button:HTMLButtonElement = document.createElement("button");
		button.innerText = "Mark All As Read";
		button.type = "button";
		$(button).on("click",buttonClicked);
		$(headerSelector).prepend(button);
	})();

	function buttonClicked():void
	{
		$(document).find(activitySelector).find(iconSelector).each(function(): void
		                                                           {
			                                                           $(this).trigger("click");
		                                                           });
	}
})();
// @endif