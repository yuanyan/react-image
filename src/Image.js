var React = require('react');

var addEvent = (function () {
    if (document.addEventListener) {
        return function addStandardEventListener(el, eventName, fn) {
            return el.addEventListener(eventName, fn, false);
        };
    } else {
        return function addIEEventListener(el, eventName, fn) {
            return el.attachEvent('on' + eventName, fn);
        };
    }
})();

var removeEvent = (function(){
    if (document.addEventListener) {
        return function removeStandardEventListener(el, eventName, fn) {
            return el.removeEventListener(eventName, fn, false);
        };
    } else {
        return function removeIEEventListener(el, eventName, fn) {
            return el.detachEvent('on' + eventName, fn);
        };
    }
})();

function debounce(fn, wait) {
    var timeout;
    return function() {
        var context = this, args = arguments;
        var later = function() {
            timeout = null;
            fn.apply(context, args);
        };

        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    }
}

function compare(a, b, state, accessorFn) {
    var aDt = accessorFn(a) - state;
    var bDt = accessorFn(b) - state;

    if ((aDt === 0 && bDt !== 0) ||  // a perfectly matches target but b does not
        (bDt < 0 && aDt >= 0)) // b is less than target but a is the same or better
    {
        return a;
    }

    if ((bDt === 0 && aDt !== 0) || // b perfectly matches target but a does not
        (aDt < 0 && bDt >= 0)) // a is less than target but b is the same or better
    {
        return b;
    }

    if (Math.abs(aDt) < Math.abs(bDt))
    {
        return a;
    }

    if (Math.abs(bDt) < Math.abs(aDt))
    {
        return b;
    }

    return a;
}

// document.body.scrollTop was working in Chrome but didn't work on Firefox, so had to resort to window.pageYOffset
// but can't fallback to document.body.scrollTop as that doesn't work in IE with a doctype (?) so have to use document.documentElement.scrollTop
function getPageOffset(){
    return window.pageYOffset || document.documentElement.scrollTop;
}

function checkElementInViewport(element, viewportHeight, lazyOffset){
    var elementOffsetTop = 0;
    var offset = getPageOffset() + lazyOffset;

    if (element.offsetParent) {
        do {
            elementOffsetTop += element.offsetTop;
        }
        while (element = element.offsetParent);
    }

    return elementOffsetTop < (viewportHeight + offset);
}

var Image = React.createClass({
    nativeSupport: false,
    propTypes: {
        src: React.PropTypes.string.isRequired,
        srcSet: React.PropTypes.string,
        sizes: React.PropTypes.string,
        alt: React.PropTypes.string,
        width: React.PropTypes.number,
        height: React.PropTypes.number,
        fade: React.PropTypes.bool,
        placeholderSrc: React.PropTypes.string,
        lazyOffset: React.PropTypes.number,
        crossorigin: React.PropTypes.oneOf(['anonymous', 'use-credentials']),
        onLoad: React.PropTypes.func,
        onError: React.PropTypes.func
    },

    getDefaultProps: function() {
        return {
            onLoad: function(){},
            onError: function(){},
            lazyOffset: 0,
            placeholderSrc: 'data:image/gif;base64,R0lGODlhEAAJAIAAAP///wAAACH5BAEAAAAALAAAAAAQAAkAAAIKhI+py+0Po5yUFQA7'
        }
    },

    getInitialState: function() {

        if (typeof document !== 'undefined') {
            var img = document.createElement('img');
            this.nativeSupport = ('sizes' in img) && ('srcset' in img);
        }

        this.onViewportResize = debounce(this.onViewportResize, 150);
        this.onViewportScroll = debounce(this.onViewportScroll, 150);

        return {
            w: this.getViewportWidth(),
            h: this.getViewportHeight(),
            x: this.getDevicePixelRatio(),
            candidates: this.buildCandidates(this.props.srcSet)
        }
    },

    componentWillReceiveProps: function(nextProps) {
        if (nextProps && nextProps.srcSet) {
            this.setState({candidates: this.buildCandidates(nextProps.srcSet)});
        }
    },

    componentDidMount: function() {

        if (typeof window !== "undefined") {

            if(this.props.lazy) {
                this.onViewportScroll();
                addEvent(window, "scroll", this.onViewportScroll);
            }

            if (!this.nativeSupport) {
                addEvent(window, "resize", this.onViewportResize);
            }
        }
    },

    componentWillUnmount: function() {

        if (typeof window !== "undefined") {

            if(this.props.lazy) {
                removeEvent(window, "scroll", this.onViewportScroll);
            }

            if (!this.nativeSupport) {
                removeEvent(window, "resize", this.onViewportResize)
            }
        }
    },

    render: function() {

        if(this.props.lazy && !this.state.lazyloaded ) return this.renderPlaceholder();

        if (this.nativeSupport) return this.renderNative();
        return (
            <img {...this.props} onLoad={this.props.onLoad} onError={this.props.onError} src={this.matchImage()}/>
        );
    },

    renderPlaceholder: function(){
        return (
            <img width={this.props.width} height={this.props.height} ref="placeholder" src={this.props.placeholderSrc} />
        )
    },

    renderNative: function() {
        return (
            <img {...this.props} onLoad={this.props.onLoad} onError={this.props.onError} src={this.state.candidates[0].url} srcSet={this.props.srcSet}/>
        );
    },

    /**
     * Takes a srcSet in the form of url/
     * ex. "images/pic-medium.png 1x, images/pic-medium-2x.png 2x" or
     *     "images/pic-medium.png 400w, images/pic-medium-2x.png 800w" or
     *     "images/pic-small.png"
     * Get an array of image candidates in the form of
     *      {url: "/foo/bar.png", x: 1, w:0, h: 0}
     * where resolution is http://dev.w3.org/csswg/css-values-3/#resolution-value
     * If sizes is specified, resolution is calculated
     */
    buildCandidates: function(srcSet) {
        return srcSet.split(',').map(function(srcImg) {
            var stringComponents = srcImg.trim().split(' ');
            var candidate = {
                url: stringComponents[0].trim(),
                w: 0,
                h: 0,
                x: 1.0
            };

            for (var i = 1; i < stringComponents.length; i++) {
                var str = stringComponents[i].trim();
                if (str.indexOf('w', str.length - 1) !== -1) {
                    candidate.w = parseInt(str.substring(0,str.length-1));
                } else if (str.indexOf('h', str.length-1) !== -1) {
                    candidate.h = parseInt(str.substring(0,str.length-1));
                } else if (str.indexOf('x', str.length-1) !== -1) {
                    candidate.x = parseFloat(str.substring(0,str.length-1));
                } else {
                    console.warn('Invalid parameter passed to Image srcSet: [' + str + '] in ' + srcImg);
                }
            }

            return candidate;
        });
    },

    matchImage: function() {
        return this.state.candidates.reduce(function(a, b) {
            if (a.x === b.x) {
                // Both have the same density so attempt to find a better one using width
                if (a.w === b.w) {
                    // Both have the same width so attempt to use height
                    if (a.h === b.h) {
                        return a; // hey, it came first!
                    } else {
                        return compare(a, b, this.state.h, function(img) { return img.h });
                    }
                } else {
                    return compare(a, b, this.state.w, function(img) { return img.w });
                }
            } else {
                return compare(a, b, this.state.x, function(img) { return img.x });
            }
        }.bind(this)).url;
    },

    onViewportResize: function() {
        // TODO: We need to time delay this, only update maybe once a second or 2
        this.setState({w: this.getViewportWidth(), h: this.getViewportHeight()});
    },

    onViewportScroll: function(){
        if(this.refs.placeholder && checkElementInViewport(this.refs.placeholder.getDOMNode(), this.getViewportHeight(), this.props.lazyOffset) ){
            this.setState({
                lazyloaded: true
            });
        }
    },

    getViewportWidth: function() {
        if (typeof window !== 'undefined') {
            return window.innerWidth || document.documentElement.clientWidth;
        } else {
            return 0;
        }
    },

    getViewportHeight: function() {
        if (typeof window !== 'undefined') {
            return window.innerHeight || document.documentElement.clientHeight;
        } else {
            return 0;
        }
    },

    getDevicePixelRatio: function() {
        if (typeof window !== 'undefined') {
            return window.devicePixelRatio;
        } else {
            return 1;
        }
    }

});

module.exports = Image;
