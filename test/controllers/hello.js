class Hello extends Controller {
	constructor(){
		console.log('hello loaded!');
		super();
	}

	test(){
		alert('Woohoo!');
	}

	something(){
		alert('YESSSS!');
	}
}

App.use(Hello);