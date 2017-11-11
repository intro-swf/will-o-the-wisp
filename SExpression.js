define(function() {

  'use strict';
  
  String.prototype.toSExpression = function() {
    return '"' + this.replace(/[^ !#-\[\]-~]/, function(c) {
      return '\' + ('0' + c.charCodeAt(0).toString(16)).slice(-2);
    }) + '"';
  };
  
  function SExpression(name, parts) {
    this.name = name;
    this.parts = parts ? Array.prototype.slice.apply(parts) : [];
  }
  SExpression.prototype = {
    toString: function() {
      var buf = ['(' + this.name];
      for (var i = 0; i < this.parts.length; i++) {
        var part = this.parts[i];
        if (typeof part.toSExpression !== 'function') {
          part = ''+part;
        }
        buf.push(part.toSExpression());
      }
      return buf.join(' ') + ')';
    },
  };
  
  return SExpression;

});
