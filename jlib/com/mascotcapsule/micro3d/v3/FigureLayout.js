define(['java'], function(java) {

  'use strict';
  
  return java.define('mascotcapsule.micro3d.v3.FigureLayout', {
    constructor: [
      [
        function FigureLayout() {
        },
      ],
      [
        './AffineTrans', 'i32', 'i32', 'i32', 'i32',
        function FigureLayout(optionalTransform, scaleX,scaleY, centerX,centerY) {
        },
      ],
    ],
    methods: {
      setAffineTrans: ['./AffineTrans', function setAffineTrans(t) {
      }],
      getAffineTrans: [{ret:'./AffineTrans'}, function getAffineTrans() {
      }],
      setCenter: ['i32', 'i32', function setCenter(x, y) {
      }],
      getCenterX: [{ret:'i32'}, function getCenterX() {
      }],
      getCenterY: [{ret:'i32'}, function getCenterY() {
      }],
      setParallelSize: ['i32','i32', function setParallelSize(v1,v2) {
      }],
      setPerspective: ['i32','i32','i32', function setPerspective(v1,v2,v3) {
      }],
    },
  });

});
