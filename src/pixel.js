var Pixel = (function() {
    'use strict';

    var CHANNELS = 4;

    function Pixel() {
        this.data = [];
        this.data[0] = arguments.length >= 1 ? arguments[0] : 0;
        this.data[1] = arguments.length >= 2 ? arguments[1] : 0;
        this.data[2] = arguments.length >= 3 ? arguments[2] : 0;
        this.data[3] = arguments.length >= 4 ? arguments[3] : 255;
    }

    Pixel.fromFloats = function(r, g, b, a) {
        var pixel = new Pixel();
        pixel.data[0] = r * 255;
        pixel.data[1] = g * 255;
        pixel.data[2] = b * 255;
        pixel.data[3] = a ? a : 255;
        return pixel;
    };

    Pixel.fromImage = function(index, img) {
        return new Pixel(
            img.data[index],
            img.data[index+1],
            img.data[index+2],
            img.data[index+3]
        );
    };

    Pixel.prototype.clone = function() {
        var copy = new Pixel();
        for (var i = 0; i < CHANNELS; i++) {
            copy.data[i] = this.data[i];
        }
        return copy;
    };

    Pixel.prototype.add = function(pixel) {
        for (var i = 0; i < CHANNELS; i++) {
            this.data[i] += pixel.data[i];
        }
        return this;
    };

    Pixel.prototype.subtract = function(pixel) {
        for (var i = 0; i < CHANNELS; i++) {
            this.data[i] -= pixel.data[i];
        }
        return this;
    };

    Pixel.prototype.multiply = function(value) {
        //If the value is a number, all pixels gets
        // multiplied by this number
        if (typeof(value) === 'number') {
            for (var i = 0; i < CHANNELS; i++) {
                this.data[i] *= value;
            }
            return this;
        }

        //Otherwise, consider the value as other pixel
        var v = value.clone().normalize();
        for (i = 0; i < 4; i++) {
            this.data[i] *= v.data[i];
        }

        return this;
    };

    Pixel.prototype.divide = function(value) {
        //If the value is a number, all pixels gets
        // multiplied by this number
        if (typeof(value) === 'number') {
            for (var i = 0; i < CHANNELS; i++) {
                this.data[i] /= value;
            }
            return this;
        }

        //Otherwise, consider the value as other pixel
        for (i = 0; i < CHANNELS; i++) {
            this.data[i] /= value.data[i];
        }

        return this;
    }

    Pixel.prototype.sizeSqr = function() {
        var sum = 0;
        for (var i = 0; i < CHANNELS; i++) {
            sum += this.data[i] * this.data[i];
        }
        return sum;
    }

    Pixel.prototype.size = function() {
        return Math.sqrt(this.sizeSqr());
    }

    Pixel.prototype.saturate = function() {
        for (var i = 0; i < CHANNELS; i++) {
            this.data[i] = this.data[i] > 255 ? 255 :
                (this.data[i] < 0 ? 0 : this.data[i]);
        }
        return this;
    }

    Pixel.prototype.toImage = function(index, img, noAlpha) {
        var ignore = noAlpha || true;

        for (var i = 0; i < CHANNELS; i++) {
            img.data[index] = this.data[0];
            img.data[index+1] = this.data[1];
            img.data[index+2] = this.data[2];
            img.data[index+3] = ignore ? 255 : this.data[3];
        }
    }

    Pixel.prototype.setFloats = function(r, g, b, a) {
        this.setRGBA(r*255, g*255, b*255, a*255);
    };

    Pixel.prototype.set = function(r, g, b, a) {
        this.data[0] = r;
        this.data[1] = g;
        this.data[2] = b;
        this.data[3] = a;
        return this;
    };

    Pixel.prototype.setGray = function(tone) {
        this.data[0] = tone;
        this.data[1] = tone;
        this.data[2] = tone;
        return this;
    };

    Pixel.prototype.invert = function() {
        for (var i = 0; i < CHANNELS; i++) {
            this.data[i] = 255 - this.data[i];
        }
        return this;
    };

    Pixel.prototype.normalize = function() {
        return this.divide(this.size());
    };

    Pixel.prototype.luminance = function() {
        return this.data[0] * 0.21 + this.data[1] * 0.72 + this.data[2] * 0.07;
    };

    Pixel.prototype.r = function() {
        return this.data[0];
    };

    Pixel.prototype.g = function() {
        return this.data[0];
    };

    Pixel.prototype.b = function() {
        return this.data[0];
    };

    Pixel.prototype.a = function() {
        return this.data[0];
    };

    Pixel.prototype.transform = function(matrix) {
        var r = this.r() * matrix[0] + this.g() * matrix[1] + this.b() * matrix[2];
        var g = this.r() * matrix[3] + this.g() * matrix[4] + this.b() * matrix[5];
        var b = this.r() * matrix[6] + this.g() * matrix[7] + this.b() * matrix[8];
        return this.set(r, g, b, this.a());
    };

    return Pixel;
})();
