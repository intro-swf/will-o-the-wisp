define(['java'], function(java) {

  function Image() {
  }
  
  java.initClass(Image, {
    name: 'javax.microedition.lcdui.Image',
    instanceMembers: {
      getGraphics: function() {
        throw new Error('NYI');
      },
      getHeight: function() {
        throw new Error('NYI');
      },
      getRGB: function(out_argbArray, offset, scanLength, x,y, width,height) {
        throw new Error('NYI');
      },
      getWidth: function() {
        throw new Error('NYI');
      },
      isMutable: function() {
        throw new Error('NYI');
      },
    },
    staticMembers: {
      createImage: function() {
        // (bytes, offset, length)
        // (image)
        // (image, x, y, width, height, transform)
        // (inputStream)
        // (width, height)
        // (resourceName)
        throw new Error('NYI');
      },
      createRGBImage: function(argbArray, width, height, processAlpha) {
        throw new Error('NYI');
      },
    },
  });
  
  return Image;

});
