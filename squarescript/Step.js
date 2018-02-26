define(function() {

	'use strict';

	function Step(name) {
  	this.name = name;
  	Object.freeze(this);
	}
	Step.prototype = {
		toJSON: function() {
			return [this.name];
		},
	};
	const store = Object.create(null);
	Step.get = function(name) {
		if (name in store) return store[name];
		return store[name] = new Step(name);
	};

	return Step;

});
