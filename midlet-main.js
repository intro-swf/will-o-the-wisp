
requirejs.config({
  timeout: Infinity,
});

require(['java', 'z'], function(java, z) {
  var xhr = new XMLHttpRequest;
  xhr.responseType = 'arraybuffer';
  xhr.open('GET', '//cors.archive.org/cors/midlet_misc/doom_rpg_mobile.jar');
  xhr.onload = function(e) {
    var jar = this.response;
    console.log(jar);
  };
  xhr.send();
});
