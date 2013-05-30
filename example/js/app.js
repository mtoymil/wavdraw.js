(function(){
  var num = 100;
  'use strict';
  console.log('App running');
  // Set up Raphael instances
  var $container = $('.master-container');

  function makeWav() {
    var newTainer = $('.canvas-container-template').clone().attr({'class': 'canvas-container'});
    $container.append(newTainer);
    var wd = WavDraw(newTainer.find('.canvas')[0], {width:newTainer.width(), height:newTainer.height(), useLoading:true, useQueue: true});

    // Fetch data
    var url = '/example/data/out.raw';
    var request = new XMLHttpRequest();
    request.open('GET', url, true);
    request.responseType = 'arraybuffer';

    function onError(err) {
      console.log(url + ' failed to load');
    }

    // Decode asynchronously
    request.onload = function() {
        console.log('pcm fetched')
        wd.loadPCM(this.response);
    }

    request.send();

    var prog = 0;
    var interval;
    interval = setInterval(function() {
      prog = prog+.5;
      if (prog> 1) {
        clearInterval(interval);
        return;
      }
      wd.setProgress(prog);

    }, 20);
  }

  for (var i=0;i<num;i++) {
    makeWav();
  }
})();
