(function(): void
{
	const delaySeconds: number = 15;
	let interval;

	const delay:number = 1000 * delaySeconds;

	if( canNotify() )
	{
		interval = setInterval(checkCart, delay);
		console.log("Interval: " + interval);
	}
	else
	{
		askNotificationPermission();
	}

	function checkCart():void
	{
		const cartList:Element | null = document.getElementsByClassName("cart_list").item(0);

		if( !cartList )
		{
			return;
		}

		const cartItems:HTMLCollection = cartList.children;
		const cartItemNames: string[] = [];

		for( let i:number = 0; i < cartItems.length; i++ )
		{
			const cartItem:Element|null = cartItems.item(i);

			if( !cartItem )
			{
				continue;
			}

			const nameContainer:Element|null = cartItem.getElementsByClassName("cart_list__list_item__info_name").item(0);

			if( !nameContainer )
			{
				continue;
			}

			const nameLink:Element|null = nameContainer.children.item(0);

			if( !nameLink )
			{
				continue;
			}

			const name: string|null = nameLink.textContent;

			if( !name )
			{
				continue;
			}

			if( name && name.length > 5 )
			{
				cartItemNames.push( name );
			}
		}

		for( let i: number = 0; i < cartItemNames.length; i++ )
		{
			const itemName: string|undefined = cartItemNames[i];

			if( !itemName )
			{
				continue;
			}

			const img: string = 'https://www.google.com/s2/favicons?sz=64&domain=amiami.com';
			const text: string = itemName + ' was added to your cart!';
			new Notification('AmiAmi Shopping Cart', {
				body: text,
				icon: img
			});
		}
	}

	function canNotify(): boolean
	{
		try
		{
			Notification.requestPermission().then();
		}
		catch(e)
		{
			return false;
		}

		return true;
	}

	function askNotificationPermission(): void
	{
		function handlePermission(): void
		{
			// set the button to shown or hidden, depending on what the user answers
			if(Notification.permission === 'denied' || Notification.permission === 'default')
			{
				console.log("Notification permission denied");
			}
			else
			{
				console.log("Notification permission granted");
			}
		}

		// Let's check if the browser supports notifications
		if(!('Notification' in window))
		{
			console.log("This browser does not support notifications.");
		}
		else
		{
			Notification.requestPermission().then(handlePermission);
		}
	}
})();