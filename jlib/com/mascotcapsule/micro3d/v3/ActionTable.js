define(['java'], function() {

  'use strict';
  
  return java.define('com.mascotcapsule.micro3d.v3.ActionTable', {
    constructor: [
      ['i8[]', function ActionTable(data) {
      }],
      ['string', function ActionTable(resourceName) {
      }],
    ],
    methods: {
      getNumActions: [{ret:'i32'}, function getNumActions() {
      }],
      getNumFrames: [{ret:'i32'}, 'i32', function getNumFrames(action) {
      }],
    },
  });

});
