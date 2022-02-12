// ==UserScript==
// @name         MFC Mark All As Read
// @namespace    http://candicejoy.com/
// @version      1.1
// @description  Adds a Mark All Read button to MFC Notifications Page
// @author       CandiceJoy
// @match        https://myfigurecollection.net/notifications/*
// @icon         https://static.myfigurecollection.net/ressources/assets/webicon.png
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// @downloadURL https://cdn.jsdelivr.net/gh/CandiceJoy/CandiceJoy-Userscripts/MFC-MarkAllRead.user.js
// @supportURL https://github.com/CandiceJoy/CandiceJoy-Userscripts/issues
// @grant        none
// ==/UserScript==
(function()
{
	"use strict";

	const headerSelector = "#main";
	const activitySelector = ".activity-wrapper";
	const iconSelector = ".icon-bell-slash";

	(function()
	{
		/*const button:HTMLButtonElement = document.createElement("button");
		button.innerText = "Mark All As Read";
		button.type = "button";
		$(headerSelector).prepend(button);*/
		const button:JSX.Element = <button type='button' onClick={buttonClicked}>Mark All As Read</button>;
		const buttonElement:string = ReactDOMServer.renderToStaticMarkup(button)
		$(headerSelector).prepend(buttonElement);
	})();

	function buttonClicked():void
	{
		$(document).find(activitySelector).find(iconSelector).each(function()
		                                                           {
			                                                           $(this).trigger("click");
		                                                           });
	}
})();
