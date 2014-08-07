var Pixel = (function() {
    'use strict';

    var RGB_CHANNELS = 3;
    var CHANNELS = 4;

    var R = 0;
    var G = 1;
    var B = 2;
    var A = 3;


    function Pixel() {
        this.data = [];
        this.data[R] = arguments.length >= 1 ? arguments[R] : 0;
        this.data[G] = arguments.length >= 2 ? arguments[G] : 0;
        this.data[B] = arguments.length >= 3 ? arguments[B] : 0;
        this.data[A] = arguments.length >= 4 ? arguments[A] : 255;
    }

    Pixel.fromFloats = function(r, g, b, a) {
        var pixel = new Pixel();
        pixel.data[R] = r * 255;
        pixel.data[G] = g * 255;
        pixel.data[B] = b * 255;
        pixel.data[A] = a ? a * 255 : 255;
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

    Pixel.distance = function(p1, p2) {
        return p1.clone().subtract(p2).size();
    };

    Pixel.prototype.clone = function() {
        return new Pixel(this.data[R], this.data[G], this.data[B], this.data[A]);
    };

    Pixel.prototype.add = function(pixel) {
        for (var i = 0; i < RGB_CHANNELS; i++) {
            this.data[i] += pixel.data[i];
        }
        return this;
    };

    Pixel.prototype.subtract = function(pixel) {
        for (var i = 0; i < RGB_CHANNELS; i++) {
            this.data[i] -= pixel.data[i];
        }
        return this;
    };

    Pixel.prototype.multiply = function(value) {
        //If the value is a number, all pixels gets
        // multiplied by this number
        if (typeof(value) === 'number') {
            for (var i = 0; i < RGB_CHANNELS; i++) {
                this.data[i] *= value;
            }
            return this;
        }

        //Otherwise, consider the value as other pixel
        return this.transform(value.clone().normalize().data.slice(0,-1));
    };

    Pixel.prototype.divide = function(value) {
        //If the value is a number, all pixels gets
        // multiplied by this number
        if (typeof(value) === 'number') {
            for (var i = 0; i < RGB_CHANNELS; i++) {
                this.data[i] /= value;
            }
            return this;
        }

        //Otherwise, consider the value as other pixel
        for (i = 0; i < RGB_CHANNELS; i++) {
            this.data[i] /= value.data[i];
        }

        return this;
    };

    Pixel.prototype.sizeSqr = function() {
        var sum = 0;
        for (var i = 0; i < RGB_CHANNELS; i++) {
            sum += this.data[i] * this.data[i];
        }
        return sum;
    };

    Pixel.prototype.size = function() {
        return Math.sqrt(this.sizeSqr());
    };

    Pixel.prototype.saturate = function() {
        for (var i = 0; i < CHANNELS; i++) {
            this.data[i] = this.data[i] > 255 ? 255 :
                (this.data[i] < 0 ? 0 : this.data[i]);
        }
        return this;
    };

    Pixel.prototype.toImage = function(index, img) {
        for (var i = 0; i < RGB_CHANNELS; i++) {
            img.data[index] = this.data[0];
            img.data[index+1] = this.data[1];
            img.data[index+2] = this.data[2];
            img.data[index+3] = this.data[3];
        }
    };

    Pixel.prototype.setFloats = function(r, g, b, a) {
        this.data[R] = r * 255;
        this.data[G] = g * 255;
        this.data[B] = b * 255;

        if (typeof(a) === "number") {
            this.data[A] = a * 255;
        }
        return this;
    };

    Pixel.prototype.set = function(r, g, b, a) {
        this.data[R] = r;
        this.data[G] = g;
        this.data[B] = b;

        if (typeof(a) === "number") {
            this.data[A] = a;
        }
        return this;
    };

    Pixel.prototype.setGray = function(tone) {
        this.data[R] = tone;
        this.data[G] = tone;
        this.data[B] = tone;
        return this;
    };

    Pixel.prototype.invert = function() {
        for (var i = 0; i < RGB_CHANNELS; i++) {
            this.data[i] = 255 - this.data[i];
        }
        return this;
    };

    Pixel.prototype.normalize = function() {
        return this.divide(this.size());
    };

    Pixel.prototype.r = function() {
        return this.data[R];
    };

    Pixel.prototype.g = function() {
        return this.data[G];
    };

    Pixel.prototype.b = function() {
        return this.data[B];
    };

    Pixel.prototype.a = function() {
        return this.data[A];
    };

    Pixel.prototype.l = function() {
        return this.data[R] * 0.2126 + this.data[G] * 0.7252 + this.data[B] * 0.0722;
    };

    Pixel.prototype.transform = function(matrix) {
        var r = this.r();
        var g = this.g();
        var b = this.b();
        var a = this.a();

        if (matrix.length == 3) {
            r = this.r() * matrix[0];
            g = this.g() * matrix[1];
            b = this.b() * matrix[2];
        } else if (matrix.length == 4) {
            r = this.r() * matrix[0];
            g = this.g() * matrix[1];
            b = this.b() * matrix[2];
            a = this.a() * matrix[3];
        } else if (matrix.length == 9) {
            r = this.r() * matrix[0] + this.g() * matrix[1] + this.b() * matrix[2];
            g = this.r() * matrix[3] + this.g() * matrix[4] + this.b() * matrix[5];
            b = this.r() * matrix[6] + this.g() * matrix[7] + this.b() * matrix[8];
        } else if (matrix.length == 12) {
            r = this.r() * matrix[0] + this.g() * matrix[1] + this.b() * matrix[2] + 255 * matrix[3];
            g = this.r() * matrix[4] + this.g() * matrix[5] + this.b() * matrix[6] + 255 * matrix[7];
            b = this.r() * matrix[8] + this.g() * matrix[9] + this.b() * matrix[10] + 255 * matrix[11];
        } else if (matrix.length == 20) {
            r = this.r() * matrix[0] + this.g() * matrix[1] + this.b() * matrix[2] + this.a() * matrix[3] + 255 * matrix[4];
            g = this.r() * matrix[5] + this.g() * matrix[6] + this.b() * matrix[7] + this.a() * matrix[8] + 255 * matrix[9];
            b = this.r() * matrix[10] + this.g() * matrix[11] + this.b() * matrix[12] + this.a() * matrix[13] + 255 * matrix[14];
            a = this.r() * matrix[15] + this.g() * matrix[16] + this.b() * matrix[17] + this.a() * matrix[18] + 255 * matrix[19];
        }
        return this.set(r, g, b, a);
    };

    Pixel.prototype.blend = function(other, v) {
        v = typeof(v) != "number" ? other.a() : v;
        v = v > 1 ? 1 : (v < 0 ? 0 : v);
        for (var i = 0; i < RGB_CHANNELS; i++) {
            this.data[i] = (1-v) * this.data[i] + v * other.data[i];
        }
        return this;
    };

    return Pixel;
})();
