define(['java', './Control'], function(java) {

  'use strict';
  
  return java.define('javax.microedition.media.Control', {
    superclass: 'interface',
    methods: {
      getControl: [{ret:Control}, 'string', function(controlType) {
      }],
      getControls: [{ret:Control.Array}, function() {
      }],
    },
  });

});
