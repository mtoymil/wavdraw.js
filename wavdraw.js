// WavDraw.js 0.0.2 - JavaScript PCM plotting library
// Author - Michael Toymil
// Dependencies - Raphael.js, underscore.js, jQuery (TODO: get rid of this)

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
    loadingStrokeColor: "#555"
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
      path: null,
      loadingPath: null,
      buffer: null,
      bufferStart: 0,
      lastX: 0,
      lastY: 0,
      loaded: false,

      drawWave: function(buffer, color, width, startX, startY, bufferStart, progress) {
        startX = startX || 0;
        startY = startY || paper.height/2;
        bufferStart = bufferStart || 0;
   
        // Setup
        var maxAmp, bufferView;
        
        switch(options.bitDepth) { // TODO: Add other depths
          case 16:
            maxAmp = 32768;
            bufferView = new Int16Array(buffer);
            break;
          default:
            break;
        }

        var end = (progress == undefined) ? bufferView.length : Math.floor(progress * bufferView.length);
        // Generate the SVG style pathstring
        var x, y;
        var ps = "M" + startX + "," + startY;
        for (var i=bufferStart; i<=end; i=i+options.skip) {
          x = ((i/bufferView.length)*paper.width);
          y = ((paper.height/2)-(bufferView[i]/maxAmp)*(paper.height/2))
          ps += "L"+ x + "," + y;
        }

        if (progress != undefined) {
          priv.lastX = x || priv.lastX;
          priv.lastY = y || priv.lastY;
          priv.bufferStart = end;
        }

        var path = paper.path(ps);
        path.attr('stroke-width', width);
        path.attr('stroke', color);
        return path;
      },

      drawProgressSubpath: function(progress, buffer) {
        var subpath = priv.drawWave(buffer, options.strokeColor, options.strokeWidth, priv.lastX, priv.lastY, priv.bufferStart, progress);
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

        path = priv.drawWave(buffer, color, width);

        (options.useLoading) ? (priv.loadingPath = path) : (priv.path = path);
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
