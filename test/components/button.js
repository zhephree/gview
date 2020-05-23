class Button extends GViewComponent{
	constructor(){
		super('button', '<button {{{attributes}}}>{{options.caption}}</button>', {});
	}
}

App.use(Button);