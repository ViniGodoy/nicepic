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

    var INSTANT_CAMERA_MATRIX = [
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

    function coordToIndex(pixels, x, y) {
        return (x + y * pixels.width) * 4;
    }

    function eachPixel(img, func, noAlpha) {
        return new Promise(function(resolve, reject) {
            var out = createImageData(img.width, img.height);
            for (var y = 0; y < img.height; y++) {
                for (var x = 0; x < img.width; x++) {
                    var i = coordToIndex(img, x, y);
                    var pixel = Pixel.fromImage(i, img);
                    func(pixel, i, x, y);
                    pixel.toImage(i, out, noAlpha);
                }
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

    function combine(img1, img2, func, px, py, x, y, w, h) {
        px = px | 0;
        py = py | 0;
        x = x | 0;
        y = y | 0;
        w = w | img2.width;
        h = h | img2.height;

        if (px < 0) {
            x += -px;
            px = 0;
        }

        if (py < 0) {
            y += -py;
            py = 0;
        }

        var x2 = Math.min(x + w, img1.width);
        var y2 = Math.min(y + h, img1.height);

        //Images do not overlap. Nothing to do.
        if (x2 < 0 || y2 < 0 || px > img1.width || py > img1.height) {
            return img1;
        }

        return eachPixel(img1, function(pixel1, index, i, j) {
            var img2X = i-x;
            var img2Y = j-y;

            if (img2X >= 0 && img2Y >= 0 && img2X < x2 && img2Y < y2) {
                var index2 = coordToIndex(img2, img2X, img2Y);
                var pixel2 = Pixel.fromImage(index2, img2);
                func(pixel1, pixel2);

            }
        });
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
        return eachPixel(img, function(pixel) {
            pixel.transform(GRAYSCALE_MATRIX);
        });
    }

    function sepia(img) {
        return eachPixel(img, function(pixel) {
            pixel.transform(SEPIA_MATRIX);
        });
    }

    function instantCamera(img) {
        return eachPixel(img, function(pixel) {
            pixel.transform(INSTANT_CAMERA_MATRIX);
        });
    }

    function binary(img, threshold) {
        var pos = threshold >= 0 ? 255 : 0;
        var neg = threshold >= 0 ? 0 : 255;
        threshold = Math.abs(threshold);
        return eachPixel(img, function(pixel) {
            pixel.setGray(img.data[index] >= threshold ? pos : neg);
        });
    }

    function inverse(img) {
        return eachPixel(img, function(pixel) {
            pixel.invert();
        });
    }

    function colorTransform(img, matrix) {
        return eachPixel(img, function(pixel) {
            pixel.transform(matrix);
        });
    }

    function brightness(img, amount) {
        amount += 1;
        if (amount < 0) amount = 0;
        return eachPixel(img, function(pixel) {
            pixel.multiply(amount);
        });
    }

    function add(img1, img2) {
        return combine(img1, img2, function(pixel1, pixel2) {
            pixel1.add(pixel2);
        });
    }

    function _add(img2) {
        return function(img) {
            return img2.then(function(loadedImg2) {
                return add(img, loadedImg2);
            });
        }
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
        instantCamera : instantCamera,
        binary : binary,
        inverse : inverse,
        colorTransform : colorTransform,
        brightness : brightness,

        _gray : gray,
        _sepia : sepia,
        _instantCamera : instantCamera,
        _binary : wrap(binary),
        _inverse : inverse,
        _add : _add,
        _colorTransform : wrap(colorTransform),
        _brightness : wrap(brightness),
        _toCanvas : wrap(toCanvas)
    };
}();
