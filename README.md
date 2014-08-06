nicepic
=======

Project description
-------------------
The idea of this project is to provide a simple yet powerful API for image 
processing using only JavaScript. The API is very focused in usability and 
code readability, since it also serves for educational purposes.

The project was created for study, so, it's only tested on [Google Chrome][1]. 
New ES6 features, such as [Promises][2], are also used. Currently, portability
among browsers (specially IE) is not a main goal.

About the samples
-----------------
Several samples are provided in the sample folder. The samples use inline 
scripts and as few css as possible, for simplicity, since it's easier to study 
just one file than several.

All sample images where kindly donated by Gilson Cavalcanti Filho, a great
photographer and a personal friend, and may be used for API demonstration and 
educational purposes. Some images are deliberately in poor quality, in order to 
demonstrate correction filters.

In order to test the samples, I recommend using [Mongoose Server][3] in
Windows. If you are a Mac User, just type **python -m SimpleHttpServer 8080**
in command prompt. In both cases, the server must be started using the same
path of this readme file as root directory (nicepic root).

Licence information
-------------------
This software is provided with GPLv3.0 licence. If you use this software
we ask you the kindness to credit the project name and website.

Also, if you modify this software (adding interesting functionality
or tests, fixing bugs, or writing documentation) please, contact the authors
to contribute to the official release. Your help will be appreciated.

Change History
--------------
* 06/08/2014 - Added brightness, polaroid and color transform functions.
* 05/08/2014 - Included Pixel class, eachPixel function and invert and sepia filters.
* 04/08/2014 - First commit. Grayscale and threshold filters.

[1]: http://www.google.com/intl/pt-BR/chrome/browser/
[2]: http://www.html5rocks.com/en/tutorials/es6/promises/?redirect_from_locale=pt
[3]: https://code.google.com/p/mongoose/