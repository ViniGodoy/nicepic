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

    var SHARPEN_KERNEL = [
        0, -1, 0,
        -1, 5, -1,
        0, -1, 0
    ];

    var EMBOSS_KERNEL = [
        -4, 0, 0,
         0, 0, 0,
         0, 0, 4
    ];

    var LAPLACE_KERNEL = [
        -0.5, -1, -0.5,
        -1,  6,   -1,
        -0.5, -1, -0.5
    ];

    //Separable kernels
    var BLUR_KERNEL_VH = [1/4, 2/4, 1/4];

    var SOBEL_XV = [1, 2, 1];
    var SOBEL_XH = [-1, 0, 1];

    var SOBEL_YV = [1, 0, -1];
    var SOBEL_YH = [1, 2, 1];

    var PREWITT_XV = [1, 1, 1];
    var PREWITT_XH = [-1, 0, 1];

    var PREWITT_YV = [1, 0, -1];
    var PREWITT_YH = [1, 1, 1];

    var cpuPower = 20000;

    var mask;
    var discardMask = false;

    //-------------------------------------------------------------------------
    // Utility functions
    //-------------------------------------------------------------------------
    function getCpuPower() {
        return cpuPower;
    }

    function getPowerFor(img) {
        var pixels = img.width * img.height;

        if (cpuPower > 1) {
            return Math.min(cpuPower, pixels);
        }

        return cpuPower === 0 ? pixels : pixels * cpuPower;
    }

    function setMask(img) {
        //If it's null, clears the mask
        if (img === undefined || img === null) {
            mask = null;
            return;
        }

        //If it's a promise. Resolves the promise
        if (img.then != undefined) {
            img.then(function (img) {
                setMask(img);
            });
            return img;
        }

        //If it's an image, sets the image
        if (img.data != undefined) {
            mask = img;
            return img;
        }

        //Otherwise, resets the mask
        img = null;
    }

    function getMask() {
        return mask;
    }

    function discardOutsideMask() {
        discardMask = true;
    }

    function setCpuPower(power) {
        if (power > 1) power = Math.round(power);
        if (power <= 0) power = 0;
        cpuPower = power;
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

    function wrap2(func) {
        var _this = this;
        return function wrapper() {
            var args = [];
            for (var i = 1; i < arguments.length; i++) {
                args[i+1] = arguments[i];
            }

            var img2 = arguments[0];
            return function(img) {
                var im2 = Promise.resolve(img2);
                return im2.then(function(loadedImg2) {
                    args[0] = img;
                    args[1] = loadedImg2;
                    return func.apply(_this, args);
                });
            }
        }
    }

    function coordToIndex(pixels, x, y) {
        return (x + y * pixels.width) * 4;
    }

    function schedule(from, to, func) {
        return new Promise(function(resolve) {
            window.setTimeout(function() {
                resolve(func(from, to));
            }, 1);
        });
    }

    function eachPixel(img, func) {
        var chunkPromises = [];
        var out = createImageData(img.width, img.height);
        var size = getPowerFor(img)*4;
        var step = Math.ceil(img.data.length / size);

        for (var s = 0; s < step; s++) {
            var from = s * size;
            var to = Math.min((s+1)*size, img.data.length);

            chunkPromises[s] = schedule(from, to, function(from, to) {
                for (var i = from; i < to; i += 4) {
                    var x = Math.floor(i / 4) % img.width;
                    var y = Math.floor(i / (img.width * 4));

                    var pixel = Pixel.fromImage(i, img);
                    if (!(mask && i < mask.data.length && Pixel.fromImage(i, mask).r() === 0))
                        func(pixel, i, x, y);
                    else if (discardMask) {
                        pixel.setGray(0);
                    }

                        pixel.toImage(i, out);
                }
            });
        }

        return Promise.all(chunkPromises).then(function() {
            discardMask = false;
            return out;
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

    function get(tbl, key, def) {
        return tbl ? (tbl[key] ? tbl[key] : def) : def;
    }

    function adjustX(x, dst, src) {
        if (typeof(x) === "number")
            return Math.round(x);
        if (x === "center")
            return (dst.width - src.width) / 2;
        if (x === "left")
            return dst.width - src.width;

        return 0;
    }

    function adjustY(y, dst, src) {
        if (typeof(y) === "number")
            return Math.round(y);
        if (y === "center")
            return (dst.height - src.height) / 2;
        if (y === "bottom")
            return dstSize.height - src.height;

        return 0;
    }

    function combine(img1, img2, func, opts) {
        var px = get(opts, "px", 0);
        var py = get(opts, "py", 0);
        var x = get(opts, "x", 0);
        var y = get(opts, "y", 0);
        var w = get(opts, "w", img2.width);
        var h = get(opts, "h", img2.height);

        if (w < 0) {
            w = img2.width + w;
        }

        if (h < 0) {
            h = img2.height + h;
        }

        if (get(opts, "p", undefined) === "center") {
            px = "center";
            py = "center";
        }

        px = adjustX(px, img1, img2);
        py = adjustY(py, img1, img2);

        if (px < 0) {
            x += -px;
            px = 0;
        }

        if (py < 0) {
            y += -py;
            py = 0;
        }

        var px2 = px + w;
        var py2 = py + h;

        //Images do not overlap. Nothing to do.
        if (px2 < 0 || py2 < 0 || px > img1.width || py > img1.height) {
            return img1;
        }

        return eachPixel(img1, function(pixel1, index, i, j) {
            //Is inside coordinates?
            if (i >= px && j >= py && i < px2 && j < py2) {
                var img2X = (i-px)+x;
                var img2Y = (j-py)+y;

                if (img2X < img2.width && img2Y < img2.height) {
                    var index2 = coordToIndex(img2, img2X, img2Y);
                    var pixel2 = Pixel.fromImage(index2, img2);
                    func(pixel1, pixel2);
                }
            }
        });
    }

    function clamp(value, min, max) {
        return value < min ? min : (value > max ? max : value);
    }

    function convolve(img, kernel, bias) {
        bias = bias || 0;
        var kSize = Math.floor(Math.sqrt(kernel.length));
        var khSize = Math.floor(kSize / 2);

        return eachPixel(img, function(pixel, index, x, y) {
            if (pixel.a() === 0)
                return;

            var sum = new Pixel();
            for (var j = 0; j < kSize; j++) {
                for (var i = 0; i < kSize; i++) {
                    var px = clamp(x + i - khSize, 0, img.width);
                    var py = clamp(y + j - khSize, 0, img.height);
                    var pix = Pixel.fromImage(coordToIndex(img, px, py), img);
                    sum.add(pix.multiply(kernel[i+j*kSize]));
                }
            }

            pixel.set(sum.r() + bias, sum.g() + bias, sum.b() + bias);
        });
    }

    function convolve2(img, kv, kh, bias) {
        kh = kh || kv;
        bias = bias || 0;

        var kvhSize = Math.floor(kv.length / 2);
        var khhSize = Math.floor(kh.length / 2);
        return eachPixel(img, function (pixel, index, x, y) {
            if (pixel.a() === 0)
                return;

            var sum = new Pixel();
            for (var j = 0; j < kv.length; j++) {
                var py = clamp(y + j - kvhSize, 0, img.height);
                var pix = Pixel.fromImage(coordToIndex(img, x, py), img);
                sum.add(pix.multiply(kv[j]));
            }

            pixel.set(sum.r() + bias, sum.g() + bias, sum.b() + bias);
        }).then(function(img) {
            return eachPixel(img, function (pixel, index, x, y) {
                if (pixel.a() === 0)
                    return;

                var sum = new Pixel();

                for (var i = 0; i < kh.length; i++) {
                    var px = clamp(x + i - khhSize, 0, img.width);
                    var pix = Pixel.fromImage(coordToIndex(img, px, y), img);
                    sum.add(pix.multiply(kh[i]));
                }

                pixel.set(sum.r() + bias, sum.g() + bias, sum.b() + bias);
            });
        });
    }

    function edgeDetect(img, kxv, kxh, kyv, kyh) {
        var gradientX = convolve2(img, kxv, kxh);
        var gradientY = convolve2(img, kyv, kyh);

        return Promise.all([gradientX, gradientY])
            .then(function(gradients) {
                return combine(gradients[0], gradients[1], function(pixel1, pixel2) {
                    var r = Math.sqrt(pixel1.r() * pixel1.r() + pixel2.r() * pixel2.r());
                    var g = Math.sqrt(pixel1.g() * pixel1.g() + pixel2.g() * pixel2.g());
                    var b = Math.sqrt(pixel1.b() * pixel1.b() + pixel2.b() * pixel2.b());
                    pixel1.set(r, g, b);
                });
            });
    }

    function newImage(width, height, paint) {
        return new Promise(function(resolve) {
            var canvas = createCanvas(width, height);
            var c = canvas.getContext("2d");
            paint(c, width, height);
            resolve(c.getImageData(0,0,width, height));
        });
    }

    //-------------------------------------------------------------------------
    // API Functions
    //-------------------------------------------------------------------------
    function read(img) {
        var canvas = createCanvas(img.width, img.height);
        var c = canvas.getContext("2d");
        c.drawImage(img, 0, 0);
        return c.getImageData(0, 0, canvas.width, canvas.height);
    }

    function loadFromInput(file) {
        return new Promise(function(resolve, reject) {
            var fr = new FileReader();
            if (file.type.substring(0, 5) != "image") {
                reject(new Error("File " + file.name + " has type '" + file.type + "', not an image!"));
                return;
            }

            fr.onload = function(e) {
                resolve(e.target.result);
            };

            fr.readAsDataURL(file);
        }).then(function(data) {
            return new Promise(function(resolve) {
                var img = new Image();
                img.onload = function() {
                    resolve(read(img));
                };
                img.src = data;
            });
        });
    }

    function load(file) {
        if (typeof(file.name) === "string") {
            return loadFromInput(file);
        }

        return new Promise(function(resolve) {
            var img = new Image();
            img.onload = function() {
                resolve(read(img));
            };
            img.src = file;
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

    function pixelate(img, sizeX, sizeY) {
        return eachPixel(img, function(pixel, i, x, y) {
            sizeY = sizeY || sizeX;
            x = Math.floor(x / sizeX)*sizeX;
            y = Math.floor(y / sizeY)*sizeY;

            var pix = Pixel.fromImage(coordToIndex(img, x, y), img);
            pixel.set(pix.r(), pix.g(), pix.b());
        });
    }

    function binary(img, threshold) {
        var pos = threshold >= 0 ? 255 : 0;
        var neg = threshold >= 0 ? 0 : 255;
        threshold = Math.abs(threshold);
        return eachPixel(img, function(pixel) {
            pixel.setGray(pixel.l() >= threshold ? pos : neg);
        });
    }

    function inverse(img) {
        return eachPixel(img, function(pixel) {
            pixel.invert();
        });
    }

    function paint(img, color) {
        return eachPixel(img, function(pixel) {
            pixel.set(color[0], color[1], color[2]);
        });
    }

    function blur(img) {
        return convolve2(img, BLUR_KERNEL_VH);
    }

    function sharpen(img) {
        return convolve(img, SHARPEN_KERNEL);
    }

    function emboss(img) {
        return convolve(img, EMBOSS_KERNEL, 125);
    }

    function laplace(img) {
        return convolve(img, LAPLACE_KERNEL);
    }

    function sobel(img) {
        return edgeDetect(img, SOBEL_XV, SOBEL_XH, SOBEL_YV, SOBEL_YH);
    }

    function prewitt(img) {
        return edgeDetect(img, PREWITT_XV, PREWITT_XH, PREWITT_YV, PREWITT_YH);
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

    function add(img1, img2, opts) {
        return combine(img1, img2, function(pixel1, pixel2) {
            pixel1.add(pixel2);
        }, opts);
    }

    function subtract(img1, img2, opts) {
        return combine(img1, img2, function(pixel1, pixel2) {
            pixel1.subtract(pixel2);
        }, opts);
    }

    function blend(img1, img2, alpha, opts) {
        return combine(img1, img2, function(pixel1, pixel2) {
            pixel1.blend(pixel2, alpha);
        }, opts);
    }

    function multiply(img1, img2, opts) {
        return combine(img1, img2, function(pixel1, pixel2) {
            pixel1.multiply(pixel2);
        }, opts);
    }

    function maskAlpha(img1, mask, opts) {
        return combine(img1, mask, function(pixel1, pixel2) {
            pixel1.data[3] = pixel2.l();
        }, opts);
    }



    function toCanvas(img, canvas, x, y, clear) {
        var c = typeof(canvas) === "string" ?
            document.getElementById(canvas) : canvas;

        x = adjustX(x, canvas, img);
        y = adjustY(y, canvas, img);

        var ctx = c.getContext("2d");

        if (clear) ctx.clearRect(0, 0, c.width, c.height);

        ctx.putImageData(img, x, y);
        return img;
    }


    return {
        load: load,
        newImage : newImage,
        cpuPower : getCpuPower,
        setCpuPower : setCpuPower,
        setMask : setMask,
        getMask : getMask,
        discardOutsideMask : discardOutsideMask,
        toCanvas : toCanvas,

        //Unitary functions
        gray : gray,
        sepia : sepia,
        instantCamera : instantCamera,
        binary : binary,
        inverse : inverse,
        colorTransform : colorTransform,
        brightness : brightness,
        convolve : convolve,
        convolve2 : convolve2,
        blur : blur,
        sharpen : sharpen,
        emboss : emboss,
        laplace : laplace,
        sobel : sobel,
        prewitt : prewitt,
        pixelate : pixelate,
        paint : paint,

        _setMask : setMask,
        _gray : gray,
        _sepia : sepia,
        _instantCamera : instantCamera,
        _binary : wrap(binary),
        _inverse : inverse,
        _colorTransform : wrap(colorTransform),
        _brightness : wrap(brightness),
        _convolve : wrap(convolve),
        _convolve2 : wrap(convolve2),
        _blur : blur,
        _sharpen : sharpen,
        _emboss : emboss,
        _laplace : laplace,
        _sobel : sobel,
        _prewitt : prewitt,
        _pixelate : wrap(pixelate),
        _toCanvas : wrap(toCanvas),
        _paint : wrap(paint),

        //Binary functions
        add : add,
        subtract : subtract,
        multiply : multiply,
        blend : blend,
        maskAlpha : maskAlpha,

        _add : wrap2(add),
        _subtract : wrap2(subtract),
        _multiply : wrap2(multiply),
        _blend : wrap2(blend),
        _maskAlpha : wrap2(maskAlpha)
    };
}();
