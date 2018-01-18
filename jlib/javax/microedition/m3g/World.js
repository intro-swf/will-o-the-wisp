define(['java', './Group'], function(java, Group) {

  'use strict';
  
  return java.define('javax.microedition.m3g.World', {
    base: Group,
    constructor: [function World() {
    }],
    methods: {
      setActiveCamera: ['./Camera', function setActiveCamera(camera) {
      }],
      getActiveCamera: [{ret:'./Camera'}, function getActiveCamera() {
      }],
      setBackground: ['./Background', function setBackground(bg) {
      }],
      getBackground: [{ret:'./Background'}, function getBackground() {
      }],
    },
  });

});
