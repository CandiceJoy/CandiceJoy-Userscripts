( function (): void
{
	"use strict";
	import("jQuery");
	const logo: string = "amiamilogo.png";

	$( "a img" ).each( function (): void
	                   {
		                   const attr: string | undefined = $( this ).attr( "src" );

		                   if ( attr && attr.includes( logo ) )
		                   {
			                   $( this ).trigger( "click" );
		                   }
	                   } );

	$( "h3 a" ).each( function (): void
	                  {
		                  const attr: string | undefined = $( this ).attr( "href" );

		                  if ( attr )
		                  {
			                  location.href = attr;
		                  }
	                  } );
} )();