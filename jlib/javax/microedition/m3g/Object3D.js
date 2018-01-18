define(['java'], function(java) {

  'use strict';
  
  return java.define('javax.microedition.m3g.Object3D', {
    methods: {
      addAnimationTrack: [
        './AnimationTrack',
        function addAnimationTrack(track) {
        },
      ],
      animate: [{ret:'i32'}, 'i32', function animate(time) {
      }],
      duplicate: [{ret:'./Object3D'}, function duplicate() {
      }],
      find: [{ret:'./Object3D'}, 'i32', function find(id) {
      }],
      getAnimationTrack: [
        {ret:'./AnimationTrack'}, 'i32',
        function getAnimationTrack(index) {
        },
      ],
      getAnimationTrackCount: [
        {ret:'i32'},
        function getAnimationTrackCount() {
        },
      ],
      getReferences: [
        {ret:'i32'}, './Object3D[]',
        function getReferences(out_refs) {
        },
      ],
      getUserID: [{ret:'i32'}, function getUserID() {
      }],
      getUserObject: [{ret:'object'}, function getUserObject() {
      }],
      removeAnimationTrack: [
        './AnimationTrack',
        function removeAnimationTrack(track) {
        },
      ],
      setUserID: ['i32', function setUserID(id) {
      }],
      setUserObject: ['object', function setUserObject(obj) {
      }],
    },
  });

});
