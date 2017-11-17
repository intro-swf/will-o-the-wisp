// Lightweight XML writer used instead of
// document.implementation.createDocument
// in order to be available in Web Workers.

define(function() {

  'use strict';
  
  function encode(str, quot) {
    return (''+str).replace(/[&<>\x00-\x08\x0B\x0C\x0E-\x1F]/g, function(c) {
      switch (c) {
        case '<': return '&lt;';
        case '&': return '&amp;';
        case '>': return '&gt;';
        case '"': return (quot === c) ? '&quot;' : c;
        case "'": return (quot === c) ? '&#39;' : c;
        default: return '&#' + c.charCodeAt(0) + ';';
      }
    });
  }
  
  function XMLWriter() {
    this.buf = [];
    this.inStack = [];
  }
  XMLWriter.prototype = {
    indent: '',
    toString: function() {
      return this.buf.join('');
    },
    raw: function(v) {
      this.buf.push(v);
    },
    encoded: function(v, quot) {
      this.buf.push(encode(v, quot));
    },
    quoted: function(v) {
      this.buf.push('"' + encode(v, '"') + '"');
    },
    tagPrefix: function(name, attrs) {
      this.raw('<' + name);
      if (attrs) {
        var k = Object.keys(attrs);
        for (var i = 0; i < k.length; i++) {
          this.raw(' ' + k[i] + '=').quoted(attrs[k[i]]);
        }
      }
      return this;
    },
    open: function(name, attrs) {
      this.inStack.push(name);
      this.indent += '  ';
      return this.tagPrefix(name, attrs).raw('>');
    },
    close: function() {
      var name = this.inStack.pop();
      if (!name) throw new Error('mismatched tags');
      this.indent = this.indent.slice(2);
      return this.raw('</' + name + '>');
    },
    empty: function(name, attrs) {
      return this.tagPrefix(name, attrs).raw('/>');
    },
    text: function(name, attrs, text) {
      if (typeof attrs === 'string') {
        text = attrs;
        attrs = null;
      }
      return this.tagPrefix(name, attrs).raw('>').encoded(text).raw('</' + name + '>');
    },
  };
  
  return XMLWriter;

});
