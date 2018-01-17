define(['java'], function(java) {

  const _TEXT = new Symbol('text');

  function Ticker(text) {
    this[_TEXT] = text;
  }
  
  java.initClass(Ticker, {
    instanceMembers: {
      getString: function() {
        return this[_TEXT];
      },
      setString: function(text) {
        this[_TEXT] = text;
      },
    },
  });
  
  return Ticker;

});
