React Image
=================

Image Component for React.

## Demo & Examples

Live demo: [yuanyan.github.io/react-image](http://yuanyan.github.io/react-image/)

To build the examples locally, run:

```
npm install
gulp dev
```

Then open [`localhost:9999`](http://localhost:9999) in a browser.

## Installation

The easiest way to use `react-image` is to install it from NPM and include it in your own React build process (using [Browserify](http://browserify.org), etc).

You can also use the standalone build by including `dist/react-image.js` in your page. If you use this, make sure you have already included React, and it is available as a global variable.

```
npm install react-image --save
```

## Usage

```
var React = require('react');
var Img = require('react-image');
var App = React.createClass({

    imgs: [
        "//placebacon.net/200/150 400w",
        "//placebacon.net/300/300 600w",
        "//placebacon.net/400/400 800w",
        "//placebacon.net/800/800 1000w"
    ],

    render: function() {

        return (
            <Img alt="Bacon..." srcset={this.imgs.join(', ')} class="baconImg"/>
        );
    }

});
```

## Properties

* `url`: Image URL, this attribute is obligatory for the <img> element. On browsers supporting srcset, src is ignored if this one is provided.
* `srcSet`: A list of one or more strings separated by commas indicating a set of possible images for the user agent to use. Each string is composed of:
    1. one URL to an image,
    2. a width descriptor, that is a positive integer directly followed by 'w'. The default value, if missing, is the infinity.
    3. a pixel density descriptor, that is a positive floating number directly followed by 'x'. The default value, if missing, is 1x.

    Each string in the list must have at least a width descriptor or a pixel density descriptor to be valid. Among the list, there must be only one string containing the same tuple of width descriptor and pixel density descriptor.
    The browser chooses the most adequate image to display at a given point of time.

* `crossorigin`: This enumerated attribute indicates if the fetching of the related image must be done using CORS or not. CORS-enabled images can be reused in the <canvas> element without being tainted. The allowed values are:
    * `anonymous`: A cross-origin request (i.e. with Origin: HTTP header) is performed. But no credential is sent (i.e. no cookie, no X.509 certificate and no HTTP Basic authentication is sent). If the server does not give credentials to the origin site (by not setting the Access-Control-Allow-Origin: HTTP header), the image will be tainted and its usage restricted..
    * `use-credentials`: A cross-origin request (i.e. with Origin: HTTP header) performed with credential is sent (i.e. a cookie, a certificate and HTTP Basic authentication is performed). If the server does not give credentials to the origin site (through Access-Control-Allow-Credentials: HTTP header), the image will be tainted and its usage restricted.
     
    When not present, the resource is fetched without a CORS request (i.e. without sending the Origin: HTTP header), preventing its non-tainted usage in <canvas> elements. If invalid, it is handled as if the enumerated keyword anonymous was used. See CORS settings attributes for additional information.
     
* `width`: The width of the image in CSS pixels.
* `height`: The height of the image in CSS pixels.
* `alt`: This attribute defines the alternative text describing the image. Users will see this displayed if the image URL is wrong, the image is not in one of the supported formats, or until the image is downloaded.
* `lazy`: Lazy load image when not in viewport, set `lazy=10` means load image when in 10px offset relative viewport.

## Events
* `onLoad`: The callback when image success loaded.
* `onError`: The callback when image error loaded.

## TODO

* `sizes`： A list of one or more strings separated by commas indicating a set of source sizes. Each source size consists of:
    1. an optional media condition,
    2. a source size value. The default, if missing, is 100vw.
    
    Source sizes values are used to specify the intended size of the image, for the purpose of selecting a source from the list supplied by the srcset attribute. The selected size becomes the intrinsic size of the image (images inherent size if no explicit CSS styling is applied). If the srcset attribute is absent, or contains no values with a width descriptor, then the sizes attribute has no effect.
