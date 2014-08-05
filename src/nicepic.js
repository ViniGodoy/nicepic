var nicepic = function() {
    'use strict';

    function createCanvas(width, height) {
        var canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        return canvas;        
    }

    function createImageData(width, height) {            
        var canvas = createCanvas(width, height);        
        var c = canvas.getContext("2d");            
        return c.createImageData(width, height);
    }

    function load(filename) {
        return new Promise(function(resolve, reject) {
            var img = new Image();
            img.onload = function() {
                var canvas = createCanvas(img.width, img.height);                
                var c = canvas.getContext("2d");
                c.drawImage(img, 0, 0);                
                resolve(c.getImageData(0, 0, canvas.width, canvas.height));
            }
            img.src = filename;
        });
    }

    function coordToIndex(pixels, x, y) {
        return (x + y * pixels.width) * 4;
    }

    function toGray(img) {    
        return new Promise(function(resolve, reject) {
            var out = createImageData(img.width, img.height);
            
            for (var i = 0; i < img.data.length; i+=4) {
                var avg = 0.21 * img.data[i] + 
                    0.72 * img.data[i+1] + 
                    0.07 * img.data[i+2];
                
                out.data[i] = avg;
                out.data[i+1] = avg;
                out.data[i+2] = avg;
                out.data[i+3] = img.data[i+3];
            }

            resolve(out);
        });
    }

    function toBinary(img, threshold) {    
        return new Promise(function(resolve, reject) {

            var pos = threshold >= 0 ? 255 : 0;
            var neg = threshold >= 0 ? 0 : 255;
            
            threshold = Math.abs(threshold);            
            var out = createImageData(img.width, img.height);
            
            for (var i = 0; i < img.data.length; i+=4) {
                var tone = img.data[i] >= threshold ? pos : neg;

                out.data[i] = tone;
                out.data[i+1] = tone;
                out.data[i+2] = tone;
                out.data[i+3] = img.data[i+3];
            }
            
            resolve(out);
        });
    }  

    function drawInCanvas(img, canvas, x, y) {        
        x = x || 0;
        y = y || 0;
        var c = typeof(canvas) === "string" ? 
            document.getElementById(canvas) : canvas;

        var ctx = c.getContext("2d");
        ctx.putImageData(img, x, y);
        return img;
    }

    function wrap(func) {
        var _this = this;
        return function wrapper() {                
            var args = [];
            for (var i = 0; i < arguments.length; i++) {
                args[i+1] = arguments[i];
            }

            return function(img) {                
                args[0] = img;                
                return func.apply(_this, args);
            }
        }
    }

    return {
        load: load,
        toGray : toGray,        
        toBinary : toBinary,
        _toGray : toGray,
        _toBinary : wrap(toBinary),
        _drawInCanvas : wrap(drawInCanvas)
    };
}()
