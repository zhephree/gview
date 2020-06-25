class GViewApp {
	constructor(options){
		this.currentView = '';
		this.currentController = null;
		this.componentClasses = {};

		let defaults = {
			root: '/',
			components: [],
			logLevel: 8,
			onNavClick: function(){},
			onLoad: function(){}
		};

		options = Object.assign({}, defaults, options);

		this.options = options;
		this.options.components;

		this.storage = {
			get: function(key){
				return JSON.parse(localStorage.getItem(key));
			},
			set: function(key, value){
				return localStorage.setItem(key, JSON.stringify(value));
			}
		}
		window.Logger = new LogController(options.logLevel);


		this.numLoadedComponents = 0;
		var hasComponents = false;
		var componentsIndexFile = './components/index.json';
		if((this.options.components && this.options.components.length > 0)){
			if(typeof this.options.components === 'string'){
				componentsIndexFile = this.options.components;
			}else{
				hasComponents = true;
				this.components = this.options.components;
			}
		}else{
			this.components = [];
		}

		if(!hasComponents){ 
			Request.get(componentsIndexFile, {type: 'json'})
				.then((response) => {
					this.components = response;
					this._loadComponents();
				})
		}else{
			this._loadComponents();
		}



		this._attachEvents();
		Logger.debug('App loaded!');
		this.options.onLoad();
	}

	_loadComponents(){
		if(this.components.length > 0){
			this.components.forEach((componentName) => {
				this.injectScript('./components/' + componentName + '.js', 'gview-component-script-' + componentName, () => {
					this.numLoadedComponents++;

					if(this.numLoadedComponents === this.components.length || this.components.length === 0){
						this._loadDefaultView()
					}
				});
			})
		}else{
			this._loadDefaultView();
		}
	}

	_loadDefaultView(){
		var path = window.location.pathname.replace(this.options.root, '');
		if(path[0] === '/') {
			path = path.slice(1);
		}
		Logger.debug('Path info', this.options.root, window.location.pathname, path);
		var viewName = '';
		if(path.length > 0){
			viewName = path;
			this.changeView(path, this.options.data)
		}else{
			viewName = this.options.view;
			this.changeView(this.options.view, this.options.data);
		}

		$('.nav-link').removeClass('active');
		$('#nav-link-' + viewName).addClass('active');
		//this.options.onNavClick({});

	}

	_attachEvents(){ Logger.debug('Adding events');
		$('#GViewNav').on('click', 'a:not([href^="http"])', (function(e){
			e.preventDefault();
			var href = $(e.target).attr('href');
			Logger.debug('click', e.target, href);
			if(href){
				if(this.options.root !== '/'){
					href = href.replace(this.options.root, '')
				}
				if(href.indexOf('http') != 0){
					var hrefParts = href.split('/');
					var viewName = hrefParts[1];
					var data = $(e.target).data('options');
					this.changeView(viewName, data);
					$('.nav-link').removeClass('active');
					$(e.target).parent().addClass('active');
					this.options.onNavClick(e);
				}
			}
		}).bind(this));

		$('#GViewContainer').on('click', 'a:not([href^="http"])', (function(e){
			e.preventDefault();
			var href = $(e.target).attr('href');
			Logger.debug('click', href);
			if(href){
				if(this.options.root !== '/'){
					href = href.replace(this.options.root, '')
				}
				if(href.indexOf('http') != 0){
					var hrefParts = href.split('/');
					var viewName = hrefParts[1];
					var data = $(e.target).data('options');
					this.changeView(viewName, data);
				}
			}
		}).bind(this));

		window.addEventListener('popstate', (function(e){
			if(e.state && e.state.view && e.state.view != null){
				this.changeView(e.state.view);
			}else{
				this.changeView(this.options.view);
			}
		}).bind(this));
	}

	changeView(viewName, data){
		let view = new View(viewName);console.log('viewName');
		view.render(data);

		history.pushState({view: viewName}, null, this.getPath(viewName));
	}

	getPath(path){
		if(this.options.root === '/'){
			return this.options.root + path;
		}else{
			return this.options.root + '/' + path;
		}
	}

	injectScript(path, id, cb){
		var s = document.createElement("script");
		s.src = path;
		s.id = id;
		s.onload = cb;
		document.body.appendChild(s);
	}

	use(className){
		let newClass = new className();
		this.componentClasses[newClass.constructor.name] = newClass;
		return newClass;
	}
}

class View {
	constructor(name){
		this.name = name;
		this.referenceName = Strings.snakeToCamel(name);
	}

	render(params){
		var params = params || {};
		Logger.debug('would render', this.referenceName);
		Request.get('./views/' + this.referenceName + '.html', {type: 'text'})
			.then((response) => {
				if(App.currentView.length > 0){
					var loadedController = document.getElementById('gview-controller-script-' + App.currentView);
					if(loadedController) document.body.removeChild(loadedController);
				}
				var t = Handlebars.compile(response);
				$('#GViewContainer').html(t(params));

				$(document.body).removeClassesWith('view-').addClass('view-' + this.name);

				$("a[href^=http]").attr('target', '_blank');

				App.injectScript('./controllers/' + this.referenceName + '.js', 'gview-controller-script-' + this.name, () => {
				});
				App.currentView = this.name;
			})
	}
}

class Controller {
	constructor(){
		App.currentController = this;
	}
}

class StringUtils {
	snakeToCamel(s){
    	return s.replace(/(\-\w)/g, function(m){return m[1].toUpperCase();});
	}

	capitalizeFirst(s){
		return s[0].toUpperCase() + s.slice(1);
	}

	snakeToClass(s){
		return this.capitalizeFirst(this.snakeToCamel(s));
	}
}

class RequestHandler {
	get(url, params){
		var defaults = {
			mode: 'cors',
			type: 'json',
			redirect: 'follow',
			headers: {
			    "Content-Type": "application/json",
			    // "Content-Type": "application/x-www-form-urlencoded",
			}
		};

		params = Object.assign({}, defaults, params);

		return fetch(url).then((r) => {
			return r[params.type]();
		})
	}

	post(url, params){
		var defaults = {
			mode: 'cors',
			type: 'json',
			redirect: 'follow',
			method: 'POST',
			headers: {
			    "Content-Type": "application/json",
			    // "Content-Type": "application/x-www-form-urlencoded",
			}
		};

		params = Object.assign({}, defaults, params);
		params.body = JSON.stringify(params.data);

		return fetch(url, params).then((r) => {
			return r[params.type]();
		})
	}

	put(url, params){
		var defaults = {
			mode: 'cors',
			type: 'json',
			redirect: 'follow',
			method: 'PUT',
			headers: {
			    "Content-Type": "application/json",
			    // "Content-Type": "application/x-www-form-urlencoded",
			}
		};

		params = Object.assign({}, defaults, params);
		params.body = JSON.stringify(params.data);

		return fetch(url, params).then((r) => {
			return r[params.type]();
		})
	}

	patch(url, params){
		var defaults = {
			mode: 'cors',
			type: 'json',
			redirect: 'follow',
			method: 'PATCH',
			headers: {
			    "Content-Type": "application/json",
			    // "Content-Type": "application/x-www-form-urlencoded",
			}
		};

		params = Object.assign({}, defaults, params);
		params.body = JSON.stringify(params.data);

		return fetch(url, params).then((r) => {
			return r[params.type]();
		})
	}

	delete(url, params){
		var defaults = {
			mode: 'cors',
			type: 'json',
			redirect: 'follow',
			method: 'DELETE',
			headers: {
			    "Content-Type": "application/json",
			    // "Content-Type": "application/x-www-form-urlencoded",
			}
		};

		params = Object.assign({}, defaults, params);
		params.body = JSON.stringify(params.data);

		return fetch(url, params).then((r) => {
			return r[params.type]();
		})
	}
}


class GViewComponent {
	constructor(name, template, data){ 
		this.name = name;
		this.template = template;
		this.data = data;
		this.options = {};
		this.events = [];
		let that = this;


		Handlebars.registerHelper(name, ((options) => {
			var attributes = [];
			that.data.options = options.hash;

		    var hasID = false;

		    this.events = [];

		    var className =  Strings.snakeToClass(name);

		    this.classEvents = Object.getOwnPropertyNames(Object.getPrototypeOf(App.componentClasses[className])).slice(1);

			Object.keys(options.hash).forEach(key => {
			    var escapedKey = Handlebars.escapeExpression(key);
			    var escapedValue = Handlebars.escapeExpression(options.hash[key]);

			    if(escapedKey.indexOf('on') === 0){
			    	this.events.push({event: escapedKey.replace('on', ''), function: escapedValue});
			    }else if(escapedKey === 'id'){
			    	this.id = escapedValue;
			    	hasID = true;
			    }else{
				    attributes.push(escapedKey + '="' + escapedValue + '"');
			    }
			});


			if(!hasID){
				this.id = 'gview-component-' + name + (UID++);
			}

			attributes.push('id="' + this.id + '"');

			Logger.debug('events', this.events);

			this.data.attributes = attributes.join(' ');
			var t = Handlebars.compile(template);
			var escapedOutput = t(this.data); 

			var attachedEvents = [];

			for(var v = 0; v < this.events.length; v++){
				var event = this.events[v];
				Logger.debug('adding listener for', event);
				attachedEvents.push(event.event);
				$('#GViewContainer').on(event.event, '#' + this.id, ((e) => {
					Logger.debug(e.target.id, this.id);
					var componentType = Strings.snakeToClass(this.id.replace('gview-component-', '').replace(/[0-9]/g, ''));
					Logger.debug('componenttype', componentType);
					if(classEvents.indexOf(event.event) > -1){
						App.componentClasses[className][event.event]();
					}
					if(App.currentController[event.function]){
						App.currentController[event.function]();
					}
				}).bind(this));
			}

			//attach parent events if none defined (they get fired above anyway if also defined)
			for(var z = 0; z < this.classEvents.length; z++){
				if(attachedEvents.indexOf(this.classEvents[z]) == -1){
					$('#GViewContainer').on(this.classEvents[z], '#' + this.id, ((e) => {
						var componentType = Strings.snakeToClass(this.id.replace('gview-component-', '').replace(/[0-9]/g, ''));
						App.componentClasses[className][e.type]();
					}).bind(this));
				}
			}

			return new Handlebars.SafeString(escapedOutput);
		}).bind(this))
	}
}



/*************
 * Log Levels:
 * 0 - No messages Logged
 * 1 - Simple debug messages
 * 2 - Debug messages with a stack trace
 * 3 - Simple debug messages and info messages
 * 4 - Simple debig messages, info messages, log messages
 * 5 - Simple debug message, info messages, log messages, and errors
 * 6 - Simple debug message, info messages, log messages, and errors with stack traces
 * 7 - Errors only w/ stack traces
 * 8 - All messages with stack traces for errors only
 * 9 - All Messages with stack traces for errors and debug
 *************/

class LogController {
	constructor(logLevel, prefix){
		this.prefix = prefix || '[GView]';
		this.level = logLevel;
	}

	debug(){
		if(this.level > 0 && this.level !== 7){
			Array.prototype.unshift.call(arguments, this.prefix);

			console.log.apply(this, arguments);
			if(this.level === 2 || this.level === 9){
				console.trace();
			}
		}
	}

	log(){
		if(this.level >= 4 && this.level !== 7){
			Array.prototype.unshift.call(arguments, this.prefix);

			console.log.apply(this, arguments);
		}
	}

	info(){
		if(this.level >= 3 && this.level !== 7) {
			Array.prototype.unshift.call(arguments, this.prefix);
		
			console.info.apply(this, arguments);
		}
	}

	error(){
		if(this.level >= 5 || this.level === 7){
			Array.prototype.unshift.call(arguments, this.prefix);
		
			console.log.error(this, arguments);
		}
		if(this.level >= 6){
			console.trace();
		}
	}

}

const Strings = new StringUtils();
const Request = new RequestHandler();
let UID = 0;