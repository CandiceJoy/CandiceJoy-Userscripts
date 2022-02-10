
class Watcher
{
	constructor(callback, node = document.querySelector("body"))
	{
		this.setCallback(callback);
		this.createObserver();

		this.options = {
			childList: true, subtree: true, attributes: true
		};

		this.setNode(node);
	}

	createObserver()
	{
		this.observer = new MutationObserver(this.observed.bind(this));
	}

	setCallback(callback)
	{
		this.callback = callback;
	}

	setNode(node)
	{
		this.node = node;
	}

	setOption(option, value)
	{
		this.options[option] = value;
	}

	//Callback takes in array of nodes, returns correct array of nodes
	setFilter(filter)
	{
		this.filter = filter;
	}

	observed(mutations)
	{
		//console.log(this);
		let nodes = [];

		mutations.forEach((mutation) =>
		                  {
			                  mutation.addedNodes.forEach((node) =>
			                                              {
				                                              nodes.push(node);
			                                              });
		                  });

		if(this.filter != undefined)
		{
			nodes = nodes.filter(this.filter);

		}

		if(nodes.length > 0)
		{
			nodes.forEach((node) =>
			              {
				              this.callback(node);
			              });
		}
	}

	on()
	{
		this.observer.observe(this.node, this.options);
	}

	off()
	{
		this.observer.disconnect();
	}
}

/*
 let watcher = new Watcher((node) =>
 {
 //Simply output each node
 console.log(node);
 });

 watcher.setFilter((node) =>
 {
 if(node instanceof HTMLDivElement)
 {
 //If the node is a div, keep it
 return true;
 }
 else
 {
 //Otherwise, dump it
 return false;
 }
 });

 //Begin watching
 watcher.on();*/