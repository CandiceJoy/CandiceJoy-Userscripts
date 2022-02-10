/* globals GM_config */
const exists = typeof GM_config != "undefined";
const types = ["number", "int", "integer", "float", "text", "textarea", "select", "button", "checkbox", "radio", "hidden"];
const allowedProperties = {
	all  : ["title", "labelPos"], text: ["size"], int: ["size", "min", "max"], float: ["size"], select: ["options"],
	radio: ["options"], hidden: ["value"], button: ["size", "click"]
};
const allowedEvents = ["init","open","save","close","reset"];

function checkProperty( type, key )
{
	let allowableProperties = allowedProperties[type];

	if(!allowableProperties.includes(key))
	{
		throw "Invalid property '" + key + "'; allowed properties are: " + allowableProperties;
	}
}
//event open: document, window, frame

class Config
{
	constructor(id, title)
	{
		this.id = id;
		this.title = title;
		this.fields = [];
		this.events = [];
	}

	add( name, label, typeIn, defaultValue, properties = null )
	{
		this.addField( name, label, typeIn, defaultValue, properties);
	}

	addField(name, label, typeIn, defaultValue, properties = null)
	{
		if(label instanceof ConfigField)
		{
			this.fields.push(label);
		}
		else
		{
			let field = new ConfigField(name, label, typeIn, defaultValue, properties);
			this.fields.push(field);
		}
	}

	setProperty( fieldIn, key, value )
	{
		if( !this.fields )
		{
			throw "No fields exist";
		}

		//console.log(this.fields);
		let field = this.fields.find(({ name }) => name === fieldIn);
		let index = this.fields.indexOf( field );

		if( !field )
		{
			throw "Field '"+fieldIn+"' not found; current fields are " + this.fields.map(x=>x.name);
		}

		checkProperty( field.type, key );

		if( !field.properties )
		{
			field.properties = {};
		}

		field.properties[key] = value;
	}

	event(name,callback)
	{
		this.addEvent(name,callback);
	}

	addEvent(name, callback)
	{
		if(!name)
		{
			throw "Name required";
		}

		if(!callback)
		{
			throw "Callback required";
		}

		if(name instanceof ConfigEvent)
		{
			this.events.push(name);
		}
		else
		{
			let event = new ConfigEvent(name, callback);
			this.events.push(event);
		}
	}

	generateFields()
	{
		let fieldsObject = {};

		for(let i in this.fields)
		{
			let field = this.fields[i];
			let fieldObject = {};

			fieldObject.label = field.label;
			fieldObject.type = field.type;

			if(field.defaultValue !== null && field.defaultValue !== undefined)
			{
				fieldObject.default = field.defaultValue;
			}

			for(let propertyName in field.properties)
			{
				let propertyValue = field.properties[propertyName];
				fieldObject[propertyName] = propertyValue;
			}

			fieldsObject[field.name] = fieldObject;
		}

		return fieldsObject;
	}

	generateEvents()
	{
		if(this.events.length <= 0)
		{
			return null;
		}

		let hasEvents = false;
		let eventsObject = {};

		for(let i in this.events)
		{
			let event = this.events[i];
			let eventObject = {};

			eventsObject[event.event] = event.callback;
			hasEvents = true;
		}

		return eventsObject;
	}

	init()
	{
		let configObject = {};

		configObject.id = this.id;
		configObject.title = this.title;
		let fields = this.generateFields();
		let events = this.generateEvents();

		if(!fields)
		{
			throw "Must have at least 1 field";
		}

		configObject.fields = fields;

		if(events)
		{
			configObject.events = events;
		}

		if(exists)
		{
			GM_config.init(configObject);
		}
		else
		{
			console.log("GM_config init");
			console.log( "As Object\n--------");
			console.log(configObject);
			console.log( "As raw\n------");
			console.log( JSON.stringify(configObject) );
		}
	}

	show()
	{
		if(exists)
		{
			GM_config.open();
		}
		else
		{
			console.log("GM_config open");
		}

		this.frame = GM_config.frame;

		return new Promise(resolve =>
		                   {
			                   this.frame.onload = function()
			                   {
				                   console.log("FRAME: " + this.frame);
				                   this.document = this.frame.contentDocument;
				                   this.window = this.frame.contentWindow;
				                   resolve();
			                   }.bind(this);
		                   });
	}

	get(name)
	{
		return GM_config.get(name);
	}
}

class ConfigEvent
{
	constructor(event, callback)
	{
		if( !allowedEvents.includes( event ) )
		{
			throw "Invalid event '"+event+"'; allowed events are " + allowedEvents;
		}

		if( !callback || !(callback instanceof Function) )
		{
			throw "Callback must be a valid function";
		}

		this.event = event;
		this.callback = callback;
	}
}

class ConfigField
{
	constructor(name, label, type, defaultValue = null, properties = null)
	{
		this.name = name;
		this.label = label;
		this.type = type;
		this.defaultValue = defaultValue;

		if(!name)
		{
			throw "Name required for " + name;
		}

		if(!label)
		{
			throw "Label required for " + name;
		}

		if(!type)
		{
			throw "Type required for " + name;
		}

		if(!types.includes(type))
		{
			throw "Invalid type '"+type+"'.  Valid types are: " + types;
		}

		if(properties)
		{
			this.properties = {};

			for( let propertyName in properties )
			{
				checkProperty( this.type, propertyName );
				this.properties[propertyName] = properties[propertyName];
			}
		}
	}
}

/* Example

 const itemConditions = ["A", "A-", "B+", "B", "C", "J"];
 const boxConditions = ["A", "B", "C", "N"];
 let configDoc;

 let config = new Config("amiami-search-filter","AmiAmi Search Filter Config");
 config.add("currency","Currency (3 Letters): ","text","usd",{size:3});
 config.add("allowedItemConditions","Lowest Allowed Item Condition: ","select","B",{options:itemConditions});
 config.add("allowedBoxConditions","Lowest Allowed Box Condition: ","select","B",{options:boxConditions});
 config.add("priceThreshold", "Hide items above this price (JPY): ", "int", "10000" );
 config.add("highlightPrice", "Highlight items below or equal to this price (JPY): ", "int", "10000" );
 config.add("exclude", "List of search terms to hide (one per line): ", "textarea", "" );
 config.add("dontExclude", "List of search terms to exclude from price and condition filters (one per line): ", "textarea", "" );
 config.init();
 await config.show(); //If you don't await, config.frame, config.document, and config.window will not be properly populated; if you're not going to use those variables, await is not needed
 $(config.document).find("div").css("color", "green"); //Example of changing the frame's document using jQuery
 */