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
  
  Jump.MODE_NONE = 0;
  Jump.MODE_FORWARDS = 1;
  Jump.MODE_BACKWARDS = 2;
  Jump.MODE_BIDIRECTIONAL = 3;
  
  function JumpGuard(mode) {
    if (arguments.length === 0) {
      mode = 3;
    }
    if (isNaN(mode) || mode !== mode & 3) {
      throw new Error('invalid mode');
    }
    this.mode = mode;
    Object.freeze(this);
  }
  JumpGuard.prototype = Object.create(Step.prototype);
  Object.assign(JumpGuard.prototype, {
    toJSON: function() {
      switch (this.mode) {
        case 0: return ['jump.guard', 'none'];
        case 1: return ['jump.guard', 'forwards'];
        case 2: return ['jump.guard', 'backwards'];
        case 3: return ['jump.guard'];
      }
    },
  });
  
  Jump.GUARD_NONE = new JumpGuard(Jump.MODE_NONE);
  
  return Jump;

});
