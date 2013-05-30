// WavDraw.js 0.0.2 - JavaScript PCM plotting library
// Author - Michael Toymil
// Dependencies - Raphael.js, underscore.js (TODO: get rid of this), jQuery (TODO: get rid of this)

(function(glob) {
  'use strict';
  // 'glob' is usually the window
  var version = '0.0.2';
  var Raphael = glob.Raphael;
  var defaultOptions = {
    // Drawing options
    width: null,                  // Drawing width
    height: null,                 // Drawing height
    strokeWidth: 2,
    strokeColor: "#FF0000",

    // PCM options
    //signed: true, // TODO
    bitDepth: 16,
    skip: 1,

    // Loading feature options
    useloading: false,
    loadingStrokeWidth: 1,
    loadingStrokeColor: "#555",

    // Queue options
    useQueue: false,
    //scrollFix: true // this was going to only load while not scrolling, doesn't seem needed though
  }
 
  var queueTime = 0;  // ms
  var queueInterval;  // the interval
  var drawQueue = []; // our fancy queue
  var drawTask = function(paper, pathData) {
      // Generate pathstring
      var x, y;
      var ps = "M" + pathData.startX + "," + pathData.startY;
      for (var i=pathData.start; i<=pathData.end; i=i+pathData.skip) {
        x = ((i/pathData.bufferView.length)*paper.width);
        y = ((paper.height/2)-(pathData.bufferView[i]/pathData.maxAmp)*(paper.height/2))
        ps += "L"+ x + "," + y;
      }
      
      // Draw with Raphael
      var path = paper.path(ps);
      path.attr('stroke-width', pathData.width);
      path.attr('stroke', pathData.color);

      // Return the path in case anyone cares
      return path;
  }

  // Our queue push method (TODO: encapsulate queue stuff)
  var pushToQueue = function(paper, pathData, useQueue) {
    if (useQueue) {
      drawQueue.push({
        paper: paper,
        pathData: pathData
      });
      if (!queueInterval) {
        queueInterval = setInterval(function() {
          if (!drawQueue.length) {
            clearInterval(queueInterval); // stop churning if queue is empty
            queueInterval = null;
            return;
          }
          var job = drawQueue.shift();
          drawTask(job.paper, job.pathData)
        }, queueTime);
      }
    } else {
      return drawTask(paper, pathData)
    }
  }

  // Factory function that will create a WavDraw instance for a given node.
  // node - DOM node to draw to
  // options - hash of options (as outlined above)
  //
  var WavDraw = function(node, options) { // The object we will tack onto 'glob'
    // Set up options
    options = _.extend({}, defaultOptions, options || {});
    options.width = options.width || $(node).width();
    options.height = options.height || $(node).height();
    // Create Raphael paper
    var paper = Raphael(node, options.width, options.height); 

    // Internal methods and attributes
    var priv = {
      buffer: null,   // the raw buffer for a given wavdraw instance
      lastProgress: 0,// the last progress value passed to the wavdraw instance
      loaded: false,  // has the first waveform been drawn/queued

      drawWave: function(buffer, color, width, progress) {
        // Create the bufferView
        var maxAmp, bufferView;
        switch(options.bitDepth) { // TODO: Add other depths
          case 16:
            maxAmp = 32768;
            bufferView = new Int16Array(buffer);
            break;
          default:
            break;
        }
        
        // Drawing params
        var start = (progress == undefined) ? 0 : Math.floor(priv.lastProgress * bufferView.length);
        var end = (progress == undefined) ? bufferView.length : Math.floor(progress * bufferView.length);
        var startX = ((start/bufferView.length)*paper.width);
        var startY = ((paper.height/2)-(bufferView[start]/maxAmp)*(paper.height/2))

        // Save progress
        priv.lastProgress = (progress == undefined) ? priv.lastProgress : progress;
        
        // Data required to draw a path
        var pathData = {
          maxAmp: maxAmp,
          bufferView: bufferView,
          width: width,
          color: color,
          startX: startX,
          startY: startY,
          start: start,
          end: end,
          skip: options.skip
        }
        return pushToQueue(paper, pathData, options.useQueue);      
      },

      drawProgressSubpath: function(progress, buffer) {
        var subpath = priv.drawWave(buffer, options.strokeColor, options.strokeWidth, progress);
        return subpath;
      }
    }
    
    // The WavDraw API instance to return
    // TODO make options mutable and the instance more dynamic in general
    var wd = {
      
      // Load in PCM buffer to draw
      loadPCM: function(buffer) {
        var path, color, width;
        priv.buffer = buffer;
        if (options.useLoading) {
          color = options.loadingStrokeColor;
          width = options.loadingStrokeWidth;
        } else {
          color = options.strokeColor;
          width = options.strokeWidth;
        }

        priv.drawWave(buffer, color, width);
        priv.loaded = true;
      },
     
      // For the loading progress feature only
      setProgress: function(progress) {
        if (!options.useLoading || !priv.loaded) {
          return;
        }

        if (((typeof progress) !== "number") || progress < 0 || progress > 1) {
          return;
        }
        priv.drawProgressSubpath(progress, priv.buffer);
      },

      // Returns Raphael paper instance
      getPaper: function() {
        return paper;
      }
    };
    
    return wd;
  }; 

  WavDraw.toString = function() {
    return 'Wavdraw version: ' + version + '\nRaphael version: ' + Raphael.version + '\nRock on!';
  }

  glob.WavDraw = WavDraw;
})(this);
