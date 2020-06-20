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

	getTest(){
		Request.get('http://dummy.restapiexample.com/api/v1/employees')
			.then((r) => {
				console.log(r);
			})
	}

	postTest(){
		Request.post('http://dummy.restapiexample.com/api/v1/create',
			{
				data: {
					name: "Geoff",
					salary: "123456",
					age: "36"
				}
			})
			.then((r) => {
				console.log(r);
			})
	}

	putTest(){
		Request.put('http://dummy.restapiexample.com/api/v1/update/21',
			{
				data: {
					name: "Geoff",
					salary: "123456",
					age: "36"
				}
			})
			.then((r) => {
				console.log(r);
			})
	}
}

App.use(Hello);