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

    var console = jsless.console;

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
                var settings = $.extend(true, {
                    name: 'show',
                    object: "jQuery",
                    method: 'show',
                    params: []
                }, jsless.settings.behavior, options.behavior, behavior);

                //shortcut for execute
                jsless.behaviors.execute($widget, $element, settings, options);
            },
            hide: function ($widget, $element, behavior, options) {
                var settings = $.extend(true, {
                    name: 'hide',
                    object: "jQuery",
                    method: 'hide',
                    params: []
                }, jsless.settings.behavior, options.behavior, behavior);

                //shortcut for execute
                jsless.behaviors.execute($widget, $element, settings, options);
            },
            plus1: function ($widget, $element, behavior, options) {
                var settings = $.extend(true, {
                    name: 'plus1',
                }, jsless.settings.behavior, options.behavior, behavior);

                var params = settings.params;
                var $eventSource = jsless.getSelector(settings.eventSource, $widget, $element).getVal();
                var targetSelector = jsless.getSelector(settings.target, $widget, $element);
                $eventSource.bind(settings.event, function (event) {
                    console.debug(settings.name + " event:" + settings.event);
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
                });
            }
        }
    }

    console.info("Loading Custom Behaviors ...");
    window.jsless = $.extend(true, _jsless, window.jsless || {}); //extend allowing overrides;
}(window.jQuery);

