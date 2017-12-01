
importScripts('require.js');

self.onmessage = function onmessage(e) {
  var message, messages = JSON.parse(e.data);
  for (var i_msg = 0; i_msg < messages.length; i_msg++) {
    switch ((message = messages[i_msg])[0]) {
      case 'open':
        var url = message[1];
        postMessage(JSON.stringify([
          ['init', {count:1, rate:12, bounds:'0 0 200 200'}],
          ['f'],
        ]));
        break;
      // case 'import':
      default:
        throw new Error('unknown message: ' + message);
    }
  }
};
