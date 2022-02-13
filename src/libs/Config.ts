/* globals GM_config */
/// <reference types="../types/GM_config"/>

const allowedProperties: object = {
	all: ["title", "labelPos"], text: ["size"], int: ["size", "min", "max"], float: ["size"], select: ["options"], radio: ["options"], hidden: ["value"], button: ["size", "click"]
};

function checkProperty(type: string, key: string): void
{
	const entries: [string, string[]][] = Object.entries(allowedProperties);
	const entry: [string, string[]] = entries.find(([propertyName]): boolean => propertyName === type)!;
	if(!entry)
	{
		throw "Internal error; invalid type after assertion to the contrary";
	}

	const [, propertyValue]: [string, any] = entry;
	if(!propertyValue.includes(key))
	{
		throw "Invalid property '" + key + "'; allowed properties are: " + allowedProperties;
	}
}

class Config
{
	public document: Document;
	public window: Window;
	public frame: HTMLIFrameElement;
	private readonly id: string;
	private readonly title: string;
	private readonly fields: ConfigField[];
	private readonly events: ConfigEvent[];

	constructor(id: string, title: string)
	{
		this.id = id;
		this.title = title;
		this.fields = [];
		this.events = [];
	}

	public add(name: string, label: string, typeIn: string, defaultValue: string, properties: object | null = null): void
	{
		this.addField(name, label, typeIn, defaultValue, properties);
	}

	private addField(name: string | ConfigField, label: string, typeIn: string, defaultValue: string, properties: object | null = null): void
	{
		if(name instanceof ConfigField)
		{
			this.fields.push(name);
		}
		else if(properties)
		{
			const field: ConfigField = new ConfigField(name, label, typeIn, defaultValue, properties);
			this.fields.push(field);
		}
		else
		{
			const field: ConfigField = new ConfigField(name, label, typeIn, defaultValue);
			this.fields.push(field);
		}
	}

	public setProperty(fieldIn: string, key: string, value: string): void
	{
		if(!this.fields)
		{
			throw "No fields exist";
		}

		const field: ConfigField | undefined = this.fields.find(({name}): boolean => name === fieldIn);

		if(!field)
		{
			throw "Field '" + fieldIn + "' not found; current fields are " + this.fields.map((x: ConfigField): string => x.name);
		}

		field.setProperty(key, value);
	}

	public event(name: string, callback: () => void): void
	{
		this.addEvent(name, callback);
	}

	public addEvent(name: string, callback: () => void): void
	{
		if(!name)
		{
			throw "Name required";
		}

		if(!callback)
		{
			throw "Callback required";
		}

		const event: ConfigEvent = new ConfigEvent(name, callback);
		this.events.push(event);
	}

	private generateFields(): object
	{
		const fieldsObject: {[key:string]:{[key:string]:string|string[]}}={};

		for(const i in this.fields)
		{
			const field: ConfigField = this.fields[i]!;
			const fieldObject: {[key:string]:string|string[]} = {
				"label": field.label, "type": field.type, "default": field.defaultValue
			};

			const props: [string, string|string[]][] = field.getProperties();

			for(const i in props)
			{
				const propTuple: [string, string|string[]] = props[i]!;
				const key: string = propTuple[0];
				fieldObject[key]=propTuple[1];
			}
			fieldsObject[field.name]= fieldObject;
		}

		return fieldsObject;
	}

	private generateEvents(): object | null
	{
		if(this.events.length <= 0)
		{
			return null;
		}

		const eventsObject: { [key:string]:()=>void} = {};

		for(const i in this.events)
		{
			const event: ConfigEvent = this.events[i]!;

			eventsObject[event.event]= event.callback;
		}

		return eventsObject;
	}

	public init(): void
	{
		const fields: object = this.generateFields();

		if(!fields)
		{
			throw "Must have at least 1 field";
		}

		const configObject: object = {
			"id": this.id, "title": this.title, "fields": fields
		};

		const events: object | null = this.generateEvents();

		if(events)
		{
			Object.defineProperty(configObject, "events", events);
		}

		GM_config.init(configObject as InitOptionsNoCustom);
	}

	public show(): Promise<unknown>
	{
		GM_config.open();
		const element: HTMLElement | undefined = GM_config.frame;

		if(element && element instanceof HTMLIFrameElement)
		{
			this.frame = element as HTMLIFrameElement;
		}

		return new Promise<void>((resolve: (value: (PromiseLike<void> | void)) => void): void =>
		                         {
			                         this.frame.onload = ((): void =>
			                         {
				                         const doc: Document | null = this.frame.contentDocument;
				                         const win: Window | null = this.frame.contentWindow;

				                         if(doc)
				                         {
					                         this.document = doc;
				                         }

				                         if(win)
				                         {
					                         this.window = win;
				                         }
			                         }).bind(this);
			                         resolve();
		                         });
	}

	public get(name: string): string
	{
		return GM_config.get(name).toString();
	}
}

class ConfigEvent
{
	private readonly allowedEvents: string[] = ["init", "open", "save", "close", "reset"];
	public readonly event: string;
	public readonly callback: () => void;

	constructor(event: string, callback: () => void)
	{
		if(!this.allowedEvents.includes(event))
		{
			throw "Invalid event '" + event + "'; allowed events are " + this.allowedEvents;
		}

		if(!callback)
		{
			throw "Callback must be a valid function";
		}

		this.event = event;
		this.callback = callback;
	}
}

type Properties = {
	[key: string]: string|string[];
};

class ConfigField
{
	private readonly types: string[] = ["number", "int", "integer", "float", "text", "textarea", "select", "button", "checkbox", "radio", "hidden"];
	public readonly name: string;
	public readonly label: string;
	public readonly type: string;
	public readonly defaultValue: string;
	private properties: Properties;

	constructor(name: string, label: string, type: string, defaultValue: string, properties: object | null = null)
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

		if(!this.types.includes(type))
		{
			throw "Invalid type '" + type + "'.  Valid types are: " + this.types;
		}

		if(properties)
		{
			this.properties = {};
			const props: Properties = properties as Properties;

			for(const propertyName in props)
			{
				checkProperty(this.type, propertyName);
				this.properties[propertyName] = props[propertyName]!;
			}
		}
	}

	public setProperty(key: string, value: string): void
	{
		if(!this.properties)
		{
			this.properties = {};
		}
		checkProperty(this.type, key);
		this.properties[key]= value;
	}

	public getProperties(): [string, string|string[]][]
	{
		const props: [string, string|string[]][] = [];

		for(const key in this.properties)
		{
			const value: string | string[] = this.properties[key]!;
			props.push([key, value]);
		}

		return props;
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