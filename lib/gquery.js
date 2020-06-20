;(function(){
  var gq_events = {};

  function gquery(s){
    var that = this;

    // this.length = 0;

    if (typeof s === 'string') {
        this.elements = document.querySelectorAll(s);
        this.selector = s;
    }else if (Array.isArray(s)){
        this.elements = s;
    }else if(NodeList.prototype.isPrototypeOf(s)){ 
        this.elements = s;
    } else { 
        this.elements = [s];
    }


    if(!LogController){
      window.GQLogger = function(){
        this.log = function(){
          console.log.apply(this, arguments);
        }

        this.debug = function(){
          console.log.apply(this, arguments);
        }

        this.info = function(){
          console.info.apply(this, arguments);
        }

        this.error = function(){
          console.error.apply(this, arguments);
        }

      }
    }else{
      window.GQLogger = new LogController(8, '[GQuery]');
    }
  }

  var UID = {
    _current: 0,
    getNew: function(){
      this._current++;
      return this._current;
    }
  };

  gquery.prototype = {
    index: function(){

    },

    find: function(s){
      this.elements = this.elements[0].querySelectorAll(s);
      return this;
    },

    on: function(e, s, cb) { 
      var events = e.split(' ');
      var selector = null;

      if(s && typeof s === 'string' && s.length > 0){
        selector = s;
      }else if(s && typeof s === 'function'){
        cb = s;
      }

      for (var i = 0; i < this.elements.length; i++) { 
          var id = '';
          if(this.elements[i].id && this.elements[i].id.length > 0){
            this.elements[i].setAttribute('data-id', this.elements[i].id);
            id = this.elements[i].id;
          }else if(this.elements[i].getAttribute('data-id') && this.elements[i].getAttribute('data-id').length > 0){
            id = this.elements[i].getAttribute('data-id');
          }else{
            id = 'gquery_element_' + UID.getNew();
            this.elements[i].setAttribute('data-id', id);
          }

          if(!gq_events.hasOwnProperty(id)){
            gq_events[id] = {};
          }

          if(!selector){
            selector = '#' + id;
          }

          if(!gq_events[id].hasOwnProperty(selector)){
            gq_events[id][selector] = {};
          }

          for(var j = 0; j < events.length; j++){
            var event = events[j];
            if(!gq_events[id][selector].hasOwnProperty(event)){
              gq_events[id][selector][event] = [];
              GQLogger.debug('adding handler for', id, selector, event);
              this.elements[i].addEventListener(event, function(eventObject){
                GQLogger.debug('event happened');
                GQLogger.debug('events', gq_events[id][selector][event]);
                for(var k = 0; k < gq_events[id][selector][event].length; k++){
                  GQLogger.debug('k=', k);

                  if(eventObject.target.matches(selector)){
                    gq_events[id][selector][event][k](eventObject);
                  }
                }
              });
            }

            gq_events[id][selector][event].push(cb);
          }
      }

      return this;
    },

    trigger: function(e){
      var event = new MouseEvent(e, {
        view: window,
        bubbles: true,
        cancelable: true
      });

      for (var i = 0; i < this.elements.length; i++) {
        this.elements[i].dispatchEvent(event);
      }
    },

    html: function(v) {
      if (v == undefined || v == null) {
          return this.elements[0].innerHTML;
      } else {
          for (var i = 0; i < this.elements.length; i++) {
              this.elements[i].innerHTML = v;
          }

          return this;
      }
    },

    append: function(v){
      for (var i = 0; i < this.elements.length; i++) {
          this.elements[i].innerHTML += v;
      }
    },

    width: function(){
      var el = this.elements[0];

      var width = el.offsetWidth;

      var style = window.getComputedStyle ? getComputedStyle(el, null) : el.currentStyle;

      var marginLeft = parseInt(style.marginLeft) || 0;
      var marginRight = parseInt(style.marginRight) || 0;
      var borderLeft = parseInt(style.borderLeftWidth) || 0;
      var borderRight = parseInt(style.borderRightWidth) || 0;

      return width + marginLeft + marginRight + borderLeft + borderRight;
    },

    height: function(){
      var el = this.elements[0];

      var height = el.offsetHeight;

      var style = window.getComputedStyle ? getComputedStyle(el, null) : el.currentStyle;

      var marginTop = parseInt(style.marginTop) || 0;
      var marginBottom = parseInt(style.marginBottom) || 0;
      var borderTop = parseInt(style.borderTopWidth) || 0;
      var borderBottom = parseInt(style.borderBottomWidth) || 0;

      return height + marginTop + marginBottom + borderTop + borderBottom;
    },

    css: function(a, v) {
      if((v == undefined || v == null) && typeof a === 'string' ){
        return window.getComputedStyle(this.elements[0]).getPropertyValue(a);
      }else{
        if(typeof a === 'string'){
          a = a.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
          for (var i = 0; i < this.elements.length; i++) {
              this.elements[i].style[a] = v;
          }
        }else{
          for(var i = 0; i < this.elements.length; i++){
            for(var k in a){
              var p = k.replace(/-([a-z])/g, function (g) { return g[1].toUpperCase(); });
              this.elements[i].style[p] = a[k];
            }
          }
        }

        return this;      
      }
    },

    pseudoCSS: function(a, v){
      var _this = this;
      var _sheetId = "pseudoStyles";
      var _head = document.head || document.getElementsByTagName('head')[0];
      var _sheet = document.getElementById(_sheetId) || document.createElement('style');
      _sheet.id = _sheetId;
      // var className = "pseudoStyle" + UID.getNew();
      
      // _this.className +=  " "+className; 
      
      _sheet.innerHTML += this.selector+"{"+a+":"+v+"}";
      _head.appendChild(_sheet);
      return this;
    },

    addClass: function(c) {
      for (var i = 0; i < this.elements.length; i++) {
          this.elements[i].classList.add(c);
      }

      return this;
    },

    removeClass: function(c) {
      for (var i = 0; i < this.elements.length; i++) {
          this.elements[i].classList.remove(c);
      }

      return this;
    },

    toggleClass: function(c) {
      for (var i = 0; i < this.elements.length; i++) {
          this.elements[i].classList.toggle(c, true);
      }

      return this;
    },

    removeAllClassesExcept: function(c){
      if(typeof c === 'string'){
        c = [c];
      }

      for (var i = 0; i < this.elements.length; i++) {
        for(var j = 0; j < this.elements[i].classList.length; j++){
          if(c.indexOf(this.elements[i].classList[j]) === -1){
            this.elements[i].classList.remove(this.elements[i].classList[j]);
          }
        }
      }

      return this;
    },

    removeAllClasses: function(){
      for (var i = 0; i < this.elements.length; i++) {
        for(var j = 0; j < this.elements[i].classList.length; j++){
            this.elements[i].classList.remove(this.elements[i].classList[j]);
        }
      }

      return this;
    },

    removeClassesWith: function(c){
      if(typeof c === 'string'){
        c = [c];
      }

      for (var i = 0; i < this.elements.length; i++) {
        for(var j = 0; j < this.elements[i].classList.length; j++){
          if((this.elements[i].classList[j].indexOf(c)) > -1){
            this.elements[i].classList.remove(this.elements[i].classList[j]);
          }
        }
      }

      return this;

    },

    class: function(c){
      if(c == null || c == undefined){
        return this.elements[0].className;
      }

      for(var i = 0; i < this.elements.length; i++){
        this.elements[i].className = c;
      }

      return this;
    },

    hasClass: function(c){
      return this.elements[0] && this.elements[0].classList.contains(c);
    },

    parent: function(){
      return $(this.elements[0].parentNode);
    },

    show: function(v) {
      for (var i = 0; i < this.elements.length; i++) {
          var d = this.elements[i].style.display;
          if (d == 'none' || !d || d == null || d == undefined) {
              this.elements[i].style.display = v || 'block';
          }
      }

      return this;
    },

    hide: function() {
      for (var i = 0; i < this.elements.length; i++) {
          this.elements[i].style.display = 'none';
      }

      return this;
    },

    data: function(a, v) {
      GQLogger.debug('el',this.elements[0]);
      if (v == null || v == undefined) {
          return this.elements[0].getAttribute('data-' + a);
      } else {
          for (var i = 0; i < this.elements.length; i++) {
              this.elements[i].setAttribute('data-' + a, v);
          }

          return this;
      }
    },

    attr: function(a, v) {
      if (v == null || v == undefined) {
          return this.elements[0].getAttribute(a);
      } else {
          for (var i = 0; i < this.elements.length; i++) {
              this.elements[i].setAttribute(a, v);
          }

          return this;
      }
    },

    position: function() {
        var el = this.elements[0];
        var rect = el.getBoundingClientRect(),
        scrollLeft = window.pageXOffset || document.documentElement.scrollLeft,
        scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        return { top: rect.top + scrollTop, left: rect.left + scrollLeft }
    },

    post: function(url, data){
      return fetch(url, {
        method: 'POST',
        mode: 'cors',
        headers: {
            "Content-Type": "application/json",
            // "Content-Type": "application/x-www-form-urlencoded",
        },
        redirect: 'follow',
        body: JSON.stringify(data)
      }).then(function(response){
        return response.json();
      })
    },

    patch: function(url, data){
      return fetch(url, {
        method: 'PATCH',
        mode: 'cors',
        headers: {
            "Content-Type": "application/json",
            // "Content-Type": "application/x-www-form-urlencoded",
        },
        redirect: 'follow',
        body: JSON.stringify(data)
      }).then(function(response){
        return response.json();
      })
    },

    get: function(url){
      return fetch(url).then(function(r){
        return r.json()
      });
    }
  }

  window.$ = function(s){
    return new gquery(s);
  }

  window.gq_events = gq_events;
})();