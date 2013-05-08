// WavDraw.js 0.0.1 - JavaScript PCM plotting library
// Author - Michael Toymil
// Dependencies - Raphael.js, underscore.js, jQuery (TODO: get rid of this)

(function(glob) {
  'use strict';
  // 'glob' is usually the window
  var version = '0.0.1';
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
    loaded: true,
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
      drawWave: function(buffer, color, width) {
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
        
        // Generate the SVG style pathstring
        var ps = "M0,"+(paper.height/2);
        for (var i=0; i<bufferView.length; i=i+options.skip) {
          ps += "L"+ ((i/bufferView.length)*paper.width) + "," + ((paper.height/2)-(bufferView[i]/maxAmp)*(paper.height/2))
        }

        var path = paper.path(ps);
        path.attr('stroke-width', width);
        path.attr('stroke', color);
        return path;
      },

      getProgressSubpath: function(progress, path) {
        var subpathLength = path.getTotalLength() * progress
        var subpath = path.getSubpath(0,subpathLength);
        return subpath;
      },

      updateMain: function(subpath) {
        if (!this.path) {
          this.path = paper.path(subpath);
          this.path.attr('stroke-width', options.strokeWidth);
          this.path.attr('stroke', options.strokeColor);
        }
        
        this.path.attr('path', subpath);
      }
    }
    
    // The WavDraw API instance to return
    // TODO make options mutable and the instance more dynamic in general
    var wd = {
      
      // Load in PCM buffer to draw
      loadPCM: function(buffer) {
        var path, color, width;
        if (options.useLoading) {
          color = options.loadingStrokeColor;
          width = options.loadingStrokeWidth;
        } else {
          color = options.strokeColor;
          width = options.strokeWidth;
        }
        
        path = priv.drawWave(buffer, color, width);

        (options.useLoading) ? (priv.loadingPath = path) : (priv.path = path);
      },
     
      // For the loading progress feature only
      setProgress: function(progress) {
        if (!options.useLoading) {
          return;
        }

        if (((typeof progress) !== "number") || progress < 0 || progress > 1) {
          return;
        }

        var subpath = priv.getProgressSubpath(progress, priv.loadingPath);
        priv.updateMain(subpath)

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
