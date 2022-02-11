let Log = class
{
	#logLevels = ["TRACE", "DEBUG", "LOG", "WARN", "ERROR", "FATAL"]; //Last one is always fatal
	#logXlat = {
		FATAL: "FATAL ERROR"
	};
	#defaultLoggerSettings = {
		timestamp: true, date: true, time: true, millis: true, name: false, timezone: true, level: true, init: true
	};

	#logDefaultLevel = "log";
	#logDefaultName = "Default";
	#logDefaultCallback = console.log;
	#logInitMessage = "Logger [$] started";
	#logInitMessageLevel = "log";

	constructor(levelIn = null, nameIn = null, callbackIn = null, settings = null)
	{
		this.loggers = [];

		if(callbackIn === null)
		{
			callbackIn = this.#logDefaultCallback;
		}

		if(levelIn === null)
		{
			levelIn = this.#logDefaultLevel;
		}

		if(nameIn === null)
		{
			nameIn = this.#logDefaultName;
		}

		if(settings === null)
		{
			settings = this.#defaultLoggerSettings;
		}

		this.addLogger(callbackIn, levelIn, nameIn, settings);
	}

	mergeSettings(settings)
	{
		let finalSettings = {};

		for(let i in this.#defaultLoggerSettings)
		{
			let input = settings[i];

			if(input === null || input === undefined || input === "")
			{
				finalSettings[i] = this.#defaultLoggerSettings[i];
			}
			else
			{
				finalSettings[i] = settings[i];
			}
		}

		return finalSettings;
	}

	createLogger(callback, level, name, settings = null)
	{
		if(settings === null)
		{
			settings = this.#defaultLoggerSettings;
		}

		let logger = {};
		logger.name = name;
		logger.callback = callback;
		logger.level = level;
		logger.settings = this.mergeSettings(settings);
		return logger;
	}

	removeLogger(nameIn)
	{
		if(!this.getLogger(nameIn))
		{
			throw "Logger does not exit [" + nameIn + "]";
		}

		let index = this.loggers.indexOf(this.getLogger(nameIn));
		this.loggers.splice(index, 1);
	}

	addLogger(callbackIn = null, levelIn = null, nameIn = null, settings = null)
	{
		if(callbackIn === null)
		{
			callbackIn = this.#logDefaultCallback;
		}

		if(levelIn === null)
		{
			levelIn = this.#logDefaultLevel;
		}

		if(nameIn === null)
		{
			nameIn = this.#logDefaultName;
		}

		if(settings === null)
		{
			settings = this.#defaultLoggerSettings;
		}

		if(this.getLogger(nameIn))
		{
			throw "Logger already exists [" + nameIn + "]";
		}

		if(!callbackIn)
		{
			throw "Invalid callback [" + callbackIn + "]";
		}

		let level = this.getLevelNumber(levelIn);

		if(!nameIn)
		{
			throw "Invalid name [" + nameIn + "]";
		}

		let logger = this.createLogger(callbackIn, level, nameIn, settings);
		this.loggers.push(logger);

		if(settings.init)
		{
			this.output(this.#logInitMessage.replaceAll("$", nameIn), this.#logInitMessageLevel);
		}
	}

	getLogger(name)
	{
		for(let i in this.loggers)
		{
			let logger = this.loggers[i];

			if(logger.name === name)
			{
				return logger;
			}
		}

		return null;
	}

	output(text, levelIn)
	{
		let level = this.getLevelName(levelIn);
		let levelNum = this.getLevelNumber(levelIn);

		for(let i in this.loggers)
		{
			let logger = this.loggers[i];
			let loggerLevel = logger.level;
			let callback = logger.callback;

			if(levelNum >= loggerLevel)
			{
				let header = this.getHeader(level, logger);
				callback(`${header}${text}`);
			}
		}

		if(levelNum === this.#logLevels.length - 1)
		{
			throw text;
		}
	}

	validateLevel(levelIn)
	{
		if(!levelIn)
		{
			this.invalidLogLevel(levelIn);
		}

		let level = levelIn.toUpperCase();

		if(!this.#logLevels.includes(level))
		{
			this.invalidLogLevel(level);
		}

		return level;
	}

	getLevelNumber(text)
	{
		return this.#logLevels.indexOf(this.validateLevel(text));
	}

	getLevelName(text)
	{
		let level = this.validateLevel(text);

		if(this.#logXlat[level])
		{
			return this.#logXlat[level];
		}
		else
		{
			return level;
		}
	}

	log(text)
	{
		this.output(text, "log");
	}

	warn(text)
	{
		this.output(text, "warn");
	}

	error(text)
	{
		this.output(text, "error");
	}

	fatal(text)
	{
		this.output(text, "fatal");
	}

	debug(text)
	{
		this.output(text, "debug");
	}

	trace(text)
	{
		this.output(text, "trace");
	}

	invalidLogLevel(levelIn)
	{
		throw `Invalid log level [${levelIn}]`;
	}

	getTimestamp(logger)
	{
		let settings = logger.settings;
		let date = new Date();
		let month = date.getMonth() + 1;
		let day = date.getDate();
		let year = date.getFullYear();
		let hour = date.getHours();
		let pm = false;

		if(hour >= 12 && hour < 24)
		{
			pm = true;
		}

		let ampm = (pm) ? "PM" : "AM";

		if(hour > 12)
		{
			hour -= 12;
		}

		let minute = date.getMinutes();
		let second = date.getSeconds();
		let milli = date.getMilliseconds();
		let timezone = date.getTimezoneOffset() / 60;

		if(timezone >= 0)
		{
			timezone = "-" + timezone;
		}
		else
		{
			timezone *= -1;
		}

		let timestamp = "";

		if(settings.date)
		{
			timestamp += `${year}-${month}-${day}`;
		}

		if(settings.time)
		{
			timestamp += ` ${hour}:${minute}:${second} ${ampm}`;
		}

		if(settings.timezone)
		{
			timestamp += ` UTC${timezone}`;
		}

		if(settings.millis)
		{
			timestamp += ` @${milli}`;
		}

		return timestamp.trim();
	}

	getHeader(level, logger)
	{
		let header = "";
		let settings = logger.settings;

		if(settings.timestamp)
		{
			header += "[" + this.getTimestamp(logger) + "]";
		}

		if(settings.name)
		{
			header += ` (${logger.name})`;
		}

		if(settings.level)
		{
			header += ` ${level}`;
		}

		header += " - ";

		return header;
	}
};