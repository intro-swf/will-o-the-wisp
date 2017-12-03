// intended for use in web workers where DOM stuff isn't available

define(function() {

  'use strict';
  
  function MakeshiftXML(name, attr) {
    this.name = name;
    this.attrValues = attr || {};
  }
  MakeshiftXML.prototype = {
    toBlobParts: function() {
      return this.addBlobPartsTo(['<?xml version="1.0" charset="utf-8"?>\n']);
    },
    toBlob: function(type) {
      return new Blob(this.toBlobParts(), {type:type || 'application/xml'});
    },
    toFile: function(name, type) {
      return new File(this.toBlobParts(), name, {type:type || 'application/xml'});
    },
    attr: function() {
      if (arguments.length === 2) {
        this.attrValues[arguments[0]] = arguments[1];
      }
      else {
        Object.assign(this.attrValues, arguments[0]);
      }
      return this;
    },
    text: function(str) {
      this.attrValues[''] = (this.attrValues || '') + str;
      return this;
    },
    open: function(name, attr) {
      if (!this.children) this.children = [];
      var child = new MakeshiftXML(name, attr);
      child.parent = this;
      this.children.push(child);
      return child;
    },
    close: function() {
      var parent = this.parent;
      delete this.parent;
      return parent;
    },
    el: function(name, attr) {
      if (!this.children) this.children = [];
      var child = new MakeshiftXML(name, attr);
      this.children.push(child);
      return this;
    },
    addBlobPartsTo: function(parts) {
      parts.push('<' + this.name);
      var textContent;
      for (attrName in this.attrValues) {
        if (attrName === '') {
          textContent = this.attrValues[attrName];
        }
        else {
          parts.push(' '+attrName+'=', enquote(this.attrValues[attrName]));
        }
      }
      if (!textContent || !this.children) {
        parts.push('/>');
        return parts;
      }
      parts.push('>');
      if (textContent) {
        parts.push(toCData(textContent));
      }
      if (this.children) for (var i = 0; i < this.children.length; i++) {
        this.children[i].addBlobPartsTo(parts); 
      }
      parts.push('</' + this.name + '>');
      return parts;
    },
    toString: function() {
      return this.addBlobPartsTo([]).join('');
    },
  };

  function enquote(str) {
    return '"' + (str+'').replace(/[&<>"]/g, function(c) {
      switch (c) {
        case '"': return '&quot;';
        case '<': return '&lt;';
        case '>': return '&gt;';
        case '&': return '&amp;';
      }
    }) + '"';
  }

  function toCData(str) {
    return '<![CDATA[' + (''+str).replace(/\]\]>/g, ']]]]><![CDATA[>') + ']]>';
  }

  return MakeshiftXML;
  
});
