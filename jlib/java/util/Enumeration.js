define(['java'], function(java) {

  'use strict';
  
  return java.define('java.util.Enumeration', {
    base: 'interface',
    methods: {
      hasMoreElements: [{ret:'boolean'}],
      nextElement: [{ret:'object'}],
    },
  });

});
