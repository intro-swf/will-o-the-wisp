define(['./Step'], function(Step) {

  'use strict';
  
  function Sequence(steps) {
    if (!Array.isArray(steps)) {
      throw new TypeError('Sequence constructor requires an array of Steps');
    }
    for (var i = 0; i < steps.length; i++) {
      if (steps[i] instanceof Step) continue;
      throw new TypeError('Sequence constructor requires an array of Steps');
    }
    if (!Object.isFrozen(steps)) {
      steps = Object.freeze(steps.slice());
    }
    this.steps = steps;
    Object.freeze(this);
  }
  Sequence.prototype = Object.create(Step.prototype);
  Object.assign(Sequence.prototype, {
    toJSON: function() {
      return this.steps;
    },
  });
  
  return Sequence;

});
