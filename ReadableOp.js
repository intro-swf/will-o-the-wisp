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
  
  function TokenReader(source) {
    this.source = source;
    this.matcher = /(\s+)|"(?:[^"\\]|\\.)*"|;;[^\r\n]*|\(;|[()]|[^();"]+/g;
  }
  TokenReader.prototype = {
    ontoken: function() { },
    onwhitespace: function() { },
    oncomment: function() { },
    next: function() {
      var index = this.matcher.lastIndex;
      if (index >= this.source.length) {
        return false;
      }
      var match = this.matcher.match(this.source);
      if (match.index !== index) {
        throw new Error('malformed input');
      }
      this.matcher.lastIndex = index + match.length;
      if (match[1]) {
        this.onwhitespace(match[1]);
        return true;
      }
      match = match[0];
      switch (match.charAt(0)) {
        case '"':
          this.ontoken('string', match);
          break;
        case ';':
          this.oncomment(match);
          break;
        case '(':
          if (match === '(;') {
            this.oncomment(match);
          }
          else {
            this.ontoken('(');
          }
          break;
        default:
          this.ontoken(match);
          break;
      }
      return true;
    },
  };
  
  return ReadableOp;
  
});
