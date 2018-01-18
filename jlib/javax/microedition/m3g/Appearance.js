define(['java', './Object3D'], function(java, Object3D) {

  'use strict';
  
  return java.define('javax.microedition.m3g.Appearance', {
    base: Object3D,
    constructor: [function Appearance() {
    }],
    methods: {
    
      getCompositingMode: [
        {ret:'./CompositingMode'},
        function getCompositingMode() {
        },
      ],
      setCompositingMode: [
        './CompositingMode',
        function setCompositingMode(mode) {
        },
      ],
      
      getFog: [
        {ret:'./Fog'},
        function getFog() {
        },
      ],
      setFog: [
        './Fog',
        function setFog(fog) {
        },
      ],
      
      getLayer: [
        {ret:'i32'},
        function getLayer() {
        },
      ],
      setLayer: [
        'i32',
        function setLayer(layer) {
        },
      ],
      
      getMaterial: [
        {ret:'./Material'},
        function getMaterial() {
        },
      ],
      setMaterial: [
        './Material',
        function setMaterial(material) {
        },
      ],
      
      getPolygonMode: [
        {ret:'./PolygonMode'},
        function getPolygonMode() {
        },
      ],
      setPolygonMode: [
        './PolygonMode',
        function setPolygonMode(mode) {
        },
      ],
      
      getTexture: [
        {ret:'./Texture2D'}, 'i32',
        function getTexture(index) {
        },
      ],
      setTexture: [
        'i32', './Testure2D',
        function setFog(index, texture) {
        },
      ],
      
    },
  });

});
