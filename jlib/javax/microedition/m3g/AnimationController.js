define(['java', './Object3D'], function(java, Object3D) {

  'use strict';
  
  return java.define('javax.microedition.m3g.AnimationController', {
    base: Object3D,
    constructor: [function AnimationController() {
    }],
    methods: {
      setActiveInterval: ['i32', 'i32', function setActiveInterval(start, end) {
      }],
      getActiveIntervalStart: [{ret:'i32'}, function getActiveIntervalEnd() {
      }],
      getActiveIntervalEnd: [{ret:'i32'}, function getActiveIntervalEnd() {
      }],
      setPosition: ['f32','i32', function setPosition(sequenceTime, worldTime) {
      }],
      getPosition: [{ret:'f32'}, 'i32', function getPosition(worldTime) {
      }],
      getRefWorldTime: [{ret:'i32'}, function getRefWorldTime() {
      }],
      setSpeed: ['f32', 'i32', function setSpeed(speed, worldTime) {
      }],
      getSpeed: [{ret:'f32'}, function getSpeed() {
      }],
      setWeight: ['f32', function setWeight(weight) {
      }],
      getWeight: [{ret:'f32'}, function getWeight() {
      }],
    },
  });

});
