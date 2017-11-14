define(function() {

  'use strict';

  function ReadableOp(op) {
    this.op = op;
  }
  ReadableOp.prototype = {
    pops: null,
    pushes: null,
    stackPop: function() {
      this.pops = this.pops || [];
      if (arguments.length === 1 && typeof arguments[0] === 'number') {
        // TODO: NaN for unknown/variable number
        for (var i = 0; i < arguments[0]; i++) {
          this.pops.push('*');
        }
      }
      else {
        this.pops.push.apply(this.pops, arguments);
      }
      return this;
    },
    stackPush: function() {
      this.pushes = this.pushes || [];
      if (arguments.length === 1 && typeof arguments[0] === 'number') {
        // TODO: NaN for unknown/variable number
        for (var i = 0; i < arguments[0]; i++) {
          this.pushes.push('*');
        }
      }
      else {
        this.pushes.push.apply(this.pushes, arguments);
      }
      return this;
    },
    assign: function(members) {
      return Object.assign(this, members);
    },
    Typify: function(Type) {
      Type.prototype = this;
      return Type;
    },
    param: function(name, value) {
      this.params = this.params || [];
      this.params.push(name);
      if (name.slice(-1) === '=') {
        name = name.slice(0, -1);
      }
      this[name] = value;
      return this;
    },
  };
  
  return ReadableOp;
  
});
