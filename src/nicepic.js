var nicepic = function() {
    'use strict';

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
            };
            img.src = filename;
        });
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

    function toGray(img) {
        return eachPixel(img, function(index, pixel) {
            pixel.setGray(pixel.luminance());
        });
    }

    function toSepia(img) {
        return eachPixel(img, function(index, pixel) {
            pixel.transform([
                0.393, 0.769, 0.189, 0,
                0.349, 0.686, 0.168, 0,
                0.272, 0.534, 0.131, 0]
            );
        });
    }

    function toBinary(img, threshold) {
        var pos = threshold >= 0 ? 255 : 0;
        var neg = threshold >= 0 ? 0 : 255;
        threshold = Math.abs(threshold);
        return eachPixel(img, function(index, pixel) {
            pixel.setGray(img.data[index] >= threshold ? pos : neg)
        });
    }

    function invert(img) {
        return eachPixel(img, function(index, pixel) {
            pixel.invert();
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

    return {
        load: load,
        toGray : toGray,
        toSepia : toSepia,
        toBinary : toBinary,
        invert : invert,
        _toGray : toGray,
        _toSepia : toSepia,
        _toBinary : wrap(toBinary),
        _drawInCanvas : wrap(drawInCanvas)
    };
}();
