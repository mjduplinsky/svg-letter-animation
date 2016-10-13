;
(function(window) {

    'use strict';

    function extend(a, b) {
        for (var key in b) {
            if (b.hasOwnProperty(key)) {
                a[key] = b[key];
            }
        }
        return a;
    }

    function collect() {
        var ret = {};
        var len = arguments.length;
        for (var i = 0; i < len; i++) {
            for (var p in arguments[i]) {
                if (arguments[i].hasOwnProperty(p)) {
                    ret[p] = arguments[i][p];
                }
            }
        }
        return ret;
    }

    function LetterPart(el, options) {
        this.el = el;
        this.options = extend({}, this.options);
        extend(this.options, options);
        // The layers/paths.
        this.layers = [].slice.call(this.el.querySelectorAll('path'));
        // Total number of layers.
        this.layersTotal = this.layers.length;
        var self = this;
        this.layers.forEach(function(layer, pos) {
            if (self.options.pathOpacityAnim) {
                layer.style.opacity = pos === self.layersTotal - 1 ? 1 : 0;
            }
            layer.style.strokeDashoffset = 0;
            layer.style.strokeDasharray = layer.getTotalLength();
        });
    }

    LetterPart.prototype.showLayers = function() {
        this.layers.forEach(function(layer, pos) {
            layer.style.opacity = 1;
        });
    };

    function Letter(el, options) {
        this.el = el;
        this.options = extend({}, this.options);
        extend(this.options, options);
        // Set transform origin (center center).
        var bcr = this.el.getBBox();
        this.el.style.transformOrigin = (bcr.x + bcr.width / 2) + 'px ' + (bcr.y + bcr.height / 2) + 'px';
        this.parts = [];
        var self = this;
        [].slice.call(this.el.querySelectorAll('g.letter__part')).forEach(function(el) {
            self.parts.push(new LetterPart(el, {
                pathOpacityAnim: self.options.pathOpacityAnim
            }));
        });
    }

    function Phrase(el, options) {
        this.el = el;
        this.options = extend({}, this.options);
        extend(this.options, options);
        this.letterElems = [].slice.call(this.el.querySelectorAll('g.letter'));
        this.letters = [];
        var self = this;
        this.letterElems.forEach(function(el) {
            self.letters.push(new Letter(el, {
                pathOpacityAnim: self.options.pathOpacityAnim
            }));
        });
    }

    Phrase.prototype.options = {

        pathOpacityAnim: false,
        outAnimation: {
            translateY: [0, 15],
            opacity: [1, 0],
            duration: 250,
            easing: 'easeInOutQuad'
        },
        inAnimation: {
            properties: {
                translateY: {
                    value: [-30, 0],
                    duration: 900,
                    elasticity: 600,
                    easing: 'easeOutElastic'
                },
                opacity: {
                    value: [0, 1],
                    duration: 500,
                    easing: 'linear'
                },
            },
            delay: 40
        },
        pathAnimation: {
            duration: 800,
            easing: 'easeOutQuint',
            delay: 200
        }
    };

    Phrase.prototype.animate = function() {
        var self = this,
            animOutProps = {
                targets: this.letterElems,
                complete: function() {
                    var animLettersProps = {
                        targets: self.letterElems,
                        delay: function(el, index) {
                            return index * self.options.inAnimation.delay;
                        }
                    };

                    anime(collect(animLettersProps, self.options.inAnimation.properties));

                    for (var i = 0, len = self.letters.length; i < len; ++i) {
                        var parts = self.letters[i].parts,
                            partsTotal = parts.length;

                        for (var j = 0, len2 = parts.length; j < len2; ++j) {
                            parts[j].showLayers();

                            var animProps = {
                                targets: parts[j].layers,
                                strokeDashoffset: function(el) {
                                    return [el.getTotalLength(), 0];
                                },
                                easing: self.options.pathAnimation.easing,
                                duration: self.options.pathAnimation.duration,
                                delay: function(el, index) {
                                    return index * self.options.pathAnimation.delay + i * self.options.inAnimation.delay;
                                }
                            };

                            if (self.options.pathOpacityAnim) {
                                animProps.opacity = {
                                    value: function(el, index) {
                                        return index !== parts[j].layers.length - 1 ? 0 : 1;
                                    },
                                    duration: 200,
                                    delay: function(el, index) {
                                        return index * self.options.pathAnimation.delay + i * self.options.inAnimation.delay + self.options.pathAnimation.duration - 0.1 * self.options.pathAnimation.duration;
                                    }
                                }
                            }

                            anime(animProps);
                        }
                    }
                }
            };

        anime(collect(animOutProps, this.options.outAnimation));
    };

    window.Phrase = Phrase;

})(window);
