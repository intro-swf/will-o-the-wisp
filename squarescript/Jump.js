define(['./Step'], function(Step) {

  'use strict';

  function Jump(labelOffset) {
    if (isNaN(labelOffset) || !isFinite(labelOffset) || labelOffset === 0 || labelOffset !== Math.floor(labelOffset)) {
      throw new RangeError('jump label offset must be a non-zero integer');
    }
    this.labelOffset = labelOffset;
    Object.freeze(this);
  }
  Jump.prototype = Object.create(Step.prototype);
  Object.assign(Jump.prototype, {
    toJSON: function() {
      return ['jump', this.labelOffset];
    },
  });
  
  Jump.LABEL = Step.get('jump.label');
  
  Jump.GUARD = Step.get('jump.guard');
  
  return Jump;

});
