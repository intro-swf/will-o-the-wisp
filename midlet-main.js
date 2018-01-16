
requirejs.config({
  timeout: Infinity,
});

require(['java'], function(java) {
  console.log(java);
});
