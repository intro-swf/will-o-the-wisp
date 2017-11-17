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
    this.buf = ['<?xml version="1.0" charset="utf-8"?>'];
    this.inStack = [];
  }
  XMLWriter.prototype = {
    indent: '\n',
    pushIndent: function() {
      this.indent = this.indent + '  ';
      return this;
    },
    popIndent: function() {
      this.indent = this.indent.slice(0, -2);
      return this;
    },
    toString: function() {
      return this.buf.join('');
    },
    raw: function(v) {
      this.buf.push(v);
      return this;
    },
    encoded: function(v, quot) {
      this.buf.push(encode(v, quot));
      return this;
    },
    quoted: function(v) {
      this.buf.push('"' + encode(v, '"') + '"');
      return this;
    },
    tagPrefix: function(name, attrs) {
      this.raw(this.indent).raw('<' + name);
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
      return this.tagPrefix(name, attrs).raw('>').pushIndent();
    },
    close: function() {
      var name = this.inStack.pop();
      if (!name) throw new Error('mismatched tags');
      this.popIndent();
      return this.raw(this.indent).raw('</' + name + '>');
    },
    empty: function(name, attrs) {
      return this.tagPrefix(name, attrs).raw('/>');
    },
    text: function(name, attrs, text) {
      if (typeof attrs === 'string') {
        text = attrs;
        attrs = null;
      }
      if (/[\r\n]/.test(text)) {
        this.pushIndent();
        text = this.indent + (''+text).replace(/\r\n|\n|\r/g, this.indent);
        this.popIndent();
        text += this.indent;
      }
      return this.tagPrefix(name, attrs).raw('>').encoded(text).raw('</' + name + '>');
    },
    textExact: function(name, attrs, text) {
      if (typeof attrs === 'string') {
        text = attrs;
        attrs = null;
      }
      return this.tagPrefix(name, attrs).raw('><![CDATA[').raw(text.replace(/\]\]>/g, ']]>]]&gt;<![CDATA[')).raw(']]></' + name + '>');
    },
    toFile: function(name, type) {
      return new File(this.buf, name, {type:type || 'application/xml'});
    },
    toBlob: function(type) {
      return new Blob(this.buf, {type:type || 'application/xml'});
    },
  };
  
  return XMLWriter;

});
