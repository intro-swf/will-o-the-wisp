define(['java', './Node'], function(java, Node) {

  'use strict';
  
  return java.define('javax.microedition.m3g.Group', {
    base: Node,
    constructor: [function Group() {
    }],
    methods: {
      addChild: ['./Node', function addChild(child) {
      }],
      getChild: [{ret:'./Node'}, 'i32', function getChild(index) {
      }],
      getChildCount: [{ret:'i32'}, function getChildCount() {
      }],
      pick: [
        [
          {ret:'boolean'}, 'i32', 'f32', 'f32', './Camera', './RayIntersection',
          function pick(scope, x,y, camera, ri) {
          },
        ],
        [
          {ret:'boolean'}, 'i32', 'f32','f32','f32','f32','f32','f32', './RayIntersection',
          function pick(scope, ox,py,oz, dx,dy,dz, ri) {
          },
        ],
      ],
      removeChild: ['./Node', function removeChild(child) {
      }],
    },
  });

});
