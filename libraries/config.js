const exists = typeof GMConfig !== "undefined";
const types = ["number", "int", "integer", "float", "text", "textarea", "select", "button", "checkbox", "radio", "hidden"];
const allowedProperties = {
	all: ["title", "labelPos"],
	text: ["size"],
	int: ["size","min","max"],
	float: ["size"],
	select: ["options"],
	radio: ["options"],
	hidden: ["value"],
	button: ["size","click"]
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

class Config
{
	constructor(id, title)
	{
		this.id = id;
		this.title = title;
		this.fields = new Array();
		this.events = new Array();
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
		let fieldsObject = new Object();

		for(let i in this.fields)
		{
			let field = this.fields[i];
			let fieldObject = new Object();

			fieldObject.label = field.label;
			fieldObject.type = field.type;
			fieldObject.default = field.defaultValue;

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
		let eventsObject = new Object();

		for(let i in this.events)
		{
			let event = this.events[i];
			let eventObject = new Object();

			eventsObject[event.event] = event.callback;
		}

		return eventsObject;
	}

	init()
	{
		let configObject = new Object();

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
			console.log(configObject);
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
	constructor(name, label, type, defaultValue, properties = null)
	{
		this.name = name;
		this.label = label;
		this.type = type;
		this.defaultValue = defaultValue;

		if(!name)
		{
			throw "Name required";
		}

		if(!label)
		{
			throw "Label required";
		}

		if(!type)
		{
			throw "Type required";
		}

		if(!defaultValue)
		{
			throw "Default value required";
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

let config = new Config("id", "title");
config.addField("name", "label", "text", "defaultValue", {size: 10});
config.addField("name2", "label2", "text", "defaultValue2");
config.setProperty( "name2", "size", 12);
config.addEvent("open", console.log);
config.addEvent("open", parseInt);
config.init();