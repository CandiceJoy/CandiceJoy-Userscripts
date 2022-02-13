class Watcher
{
	private readonly options: object;
	private observer: MutationObserver;
	private callback: (arg0: Node) => void;
	private node: Node;
	private filter: () => boolean;

	constructor(callback: (arg0: Node) => void, node: HTMLBodyElement | null = document.querySelector("body"))
	{
		this.setCallback(callback);
		this.createObserver();

		this.options = {
			childList: true, subtree: true, attributes: true
		};

		this.setNode(node);
	}

	createObserver(): void
	{
		this.observer = new MutationObserver(this.observed.bind(this));
	}

	setCallback(callback: (arg0: Node) => void): void
	{
		this.callback = callback;
	}

	setNode(node: Node | null): void
	{
		if(node)
		{
			this.node = node;
		}

	}

	setOption(option: string, value: string): void
	{
		Object.defineProperty(this.options, option, value);
	}

	//Callback takes in array of nodes, returns correct array of nodes
	setFilter(filter: () => boolean): void
	{
		this.filter = filter;
	}

	observed(mutations: MutationRecord[]): void
	{
		//console.log(this);
		let nodes: Node[] = [];

		mutations.forEach((mutation: MutationRecord): void =>
		                  {
			                  mutation.addedNodes.forEach((node: Node): void =>
			                                              {
				                                              nodes.push(node);
			                                              });
		                  });

		if(this.filter !== undefined)
		{
			nodes = nodes.filter(this.filter);

		}

		if(nodes.length > 0)
		{
			nodes.forEach((node: any): void =>
			              {
				              this.callback(node);
			              });
		}
	}

	on(): void
	{
		this.observer.observe(this.node, this.options);
	}

	off(): void
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