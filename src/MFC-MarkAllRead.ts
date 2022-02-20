(function(): void
{
	"use strict";
	import("jQuery");

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