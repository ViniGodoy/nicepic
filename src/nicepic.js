var nicepic = function() {
    'use strict';

    var GRAYSCALE_MATRIX = [
        0.2126, 0.7252, 0.0722,
        0.2126, 0.7252, 0.0722,
        0.2126, 0.7252, 0.0722
    ];

    var SEPIA_MATRIX = [
        0.393, 0.769, 0.189,
        0.349, 0.686, 0.168,
        0.272, 0.534, 0.131
    ];

    var POLAROID_MATRIX = [
        1.438, 0.122, 0.016, 0.03,
        -0.062, 1.378, -0.016, 0.05,
        -0.062, -0.122, 1.483, -0.02
    ];
    //-------------------------------------------------------------------------
    // Utility functions
    //-------------------------------------------------------------------------
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

    function eachPixel(img, func, ignore) {
        return new Promise(function(resolve, reject) {
            var out = createImageData(img.width, img.height);
            for (var i = 0; i < img.data.length; i+=4) {
                var pixel = Pixel.fromImage(i, img);
                func(i, pixel);
                pixel.toImage(i, out, ignore);
            }

            resolve(out);
        });
    }

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

    //-------------------------------------------------------------------------
    // API Functions
    //-------------------------------------------------------------------------
    function load(filename) {
        return new Promise(function(resolve, reject) {
            var img = new Image();
            img.onload = function() {
                var canvas = createCanvas(img.width, img.height);                
                var c = canvas.getContext("2d");
                c.drawImage(img, 0, 0);                
                resolve(c.getImageData(0, 0, canvas.width, canvas.height));
            };
            img.src = filename;
        });
    }


    function gray(img) {
        return eachPixel(img, function(index, pixel) {
            pixel.transform(GRAYSCALE_MATRIX);
        });
    }

    function sepia(img) {
        return eachPixel(img, function(index, pixel) {
            pixel.transform(SEPIA_MATRIX);
        });
    }

    function polaroid(img) {
        return eachPixel(img, function(index, pixel) {
            pixel.transform(POLAROID_MATRIX);
        });
    }

    function binary(img, threshold) {
        var pos = threshold >= 0 ? 255 : 0;
        var neg = threshold >= 0 ? 0 : 255;
        threshold = Math.abs(threshold);
        return eachPixel(img, function(index, pixel) {
            pixel.setGray(img.data[index] >= threshold ? pos : neg);
        });
    }

    function inverse(img) {
        return eachPixel(img, function(index, pixel) {
            pixel.invert();
        });
    }

    function colorTransform(img, matrix) {
        return eachPixel(img, function(index, pixel) {
            pixel.transform(matrix);
        });
    }

    function brightness(img, amount) {
        amount += 1;
        if (amount < 0) amount = 0;
        return eachPixel(img, function(index, pixel) {
            pixel.multiply(amount);
        });
    }

    function toCanvas(img, canvas, x, y) {
        x = x || 0;
        y = y || 0;
        var c = typeof(canvas) === "string" ?
            document.getElementById(canvas) : canvas;

        var ctx = c.getContext("2d");
        ctx.putImageData(img, x, y);
        return img;
    }

    return {
        load: load,
        gray : gray,
        sepia : sepia,
        polaroid : polaroid,
        binary : binary,
        inverse : inverse,
        colorTransform : colorTransform,
        brightness : brightness,

        _gray : gray,
        _sepia : sepia,
        _polaroid : polaroid,
        _binary : wrap(binary),
        _inverse : inverse,
        _colorTransform : wrap(colorTransform),
        _brightness : wrap(brightness),
        _toCanvas : wrap(toCanvas)
    };
}();
