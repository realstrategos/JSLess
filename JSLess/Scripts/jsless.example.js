/*!
 * JSLess Library - Example Behaviors
 * https://github.com/realstrategos/JSLess
 * *
 * Copyright 2013 OptixConnect LLC and other contributors
 * Released under the Creative Commons Attribution NonCommercial (CC-NC)
 * http://creativecommons.org/licenses/by-nc/3.0/legalcode
 *
 *
 * Rename this file to jsless.custom.js and add your own or 
 * user contributed behaviors from https://github.com/realstrategos/JSLess/Behaviors
 */

!function ($) {
    "use strict"; // jshint ;_;

    var logger = jsless.logger;

    var _jsless = {
        settings: {
            behavior: { //defaults
                name: null,
                event: 'click',
                eventSource: 'self',
                target: 'self',
                delay: -1,
                params: []
            }
        },
        behaviors: {
            show: function ($widget, $element, behavior, options) {
                var settings = $.extend(true, {}, jsless.settings.behavior, options.behavior, {
                    name: 'show',
                    object: "jQuery",
                    method: 'show',
                    params: []
                }, behavior);

                //shortcut for execute
                jsless.behaviors.execute($widget, $element, settings, options);
            },
            hide: function ($widget, $element, behavior, options) {
                var settings = $.extend(true, {}, jsless.settings.behavior, options.behavior, {
                    name: 'hide',
                    object: "jQuery",
                    method: 'hide',
                    params: []
                }, behavior);

                //shortcut for execute
                jsless.behaviors.execute($widget, $element, settings, options);
            },
            plus1: function ($widget, $element, behavior, options) {
                var settings = $.extend(true, {}, jsless.settings.behavior, options.behavior, {
                    name: 'plus1',
                }, behavior);

                var params = settings.params;
                var $eventSource = jsless.getSelector(settings.eventSource, $widget, $element).getVal();
                var targetSelector = jsless.getSelector(settings.target, $widget, $element);

                var onEvent = function (event, eventData) {
                    logger.debug(settings.name + " event:" + settings.event);
                    var request = $element.triggerHandler("jsless-" + settings.name + "-begin"); // allow for intercept and termination
                    if (request === undefined || request) {
                        var $targets = targetSelector.getVal();
                        $.each($targets, function (indx, elem) {
                            var $target = $(elem);
                            var val = parseFloat($target.val());
                            val += 1;
                            $target.val(val);
                        });
                    }
                }
                //use default binding settings
                jsless.behaviors.base($widget, $element, settings, onEvent);
            },
            htmlnext: function ($widget, $element, behavior, options) {
                var settings = $.extend(true, {}, jsless.settings.method, options.method, {
                    name: 'htmlnext',
                    next: '[data-history="next"]',
                    prev: '[data-history="prev"]',
                    back: '[data-history="back"]',
                    root: '[data-jsless-widget]',
                    level: 1
                }, behavior);

                var $root = $($element.parents(settings.root)[settings.level - 1]);

                var target = jsless.getSelector(settings.next, $root, $element);
                var compiledParams = jsless.compileParams(settings.params, $widget, $element);
                var onEvent = function (event, eventData) {
                    var $target = target.getVal();
                    var $prev = $root.find(settings.prev);
                    $target.show();
                    $prev.hide();
                    $target.one("jsless-htmlnext-complete", function () {
                        $target.find(settings.back).click(function () {
                            $prev.show();
                            $target.hide();
                        });
                    });
                    jsless._methods.htmlevent(event, $widget, $element, settings, target, target, compiledParams, options);
                }
                //use default binding settings
                jsless.behaviors.base($widget, $element, settings, onEvent);
            }
        }
    }

    logger.info("Loading Custom Behaviors ...");
    window.jsless = $.extend(true, _jsless, window.jsless || {}); //extend allowing overrides;
}(window.jQuery);

