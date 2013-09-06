/*!
 * JSLess Library - Builtin Behaviors
 * http://jquery.com/
 * *
 * Copyright 2012 jQuery Foundation and other contributors
 * Released under the MIT license
 * http://jquery.org/license
 *
 * Date: Tue Nov 13 2012 08:20:33 GMT-0500 (Eastern Standard Time)
 */

!function ($) {
    "use strict"; // jshint ;_;

    var console = jsless.console;

    var _jsless = {
        settings: {
            behavior: {
                name: null,
                event: 'click',
                eventSource: 'self',
                target: 'self',
                delay: -1,
                params: []
            }
        },
        behaviors: {
            execute: function ($widget, $element, behavior, options) {
                var settings = $.extend(true, {
                    name: 'execute',
                    object: "jQuery",
                    method: null
                }, jsless.settings.behavior, options.behavior, behavior);
                if (!settings.method) {
                    console.error("execute method not specified: " + JSON.stringify(settings));
                }
                var params = settings.params;
                var $eventSource = jsless.getSelector(settings.eventSource, $widget, $element).getVal();
                var targetSelector = jsless.getSelector(settings.target, $widget, $element);
                $eventSource.bind(settings.event, function (event) {
                    console.debug(settings.name + " event:" + settings.event);
                    var request = $element.triggerHandler("jsless-" + settings.name + "-begin"); // allow for intercept and termination
                    if (request === undefined || request) {
                        var $target = targetSelector.getVal();

                        var complete = function () {
                            $element.triggerHandler("jsless-" + settings.name + "-beforecomplete");
                            var object = $target;
                            var method = $target[settings.method];
                            if (settings.object != "jQuery") {                                
                                params.unshift($target); //target is the first parameter
                                var object = window;
                                $.each(settings.object.split("."), function (indx, oname) {
                                    object = object[oname];
                                });
                                var method = object[settings.method];                                
                            }
                            var result = method.apply(object, params);

                            $element.triggerHandler("jsless-" + settings.name + "-complete");
                        }
                        if (settings.delay < 0) {
                            complete();
                        }
                        else {
                            setTimeout(complete, settings.delay);
                        }
                    }
                });

            }
        }
    }

    console.info("Loading Behaviors ...");
    window.jsless = $.extend(true, _jsless, window.jsless || {}); //extend allowing overrides;
}(window.jQuery);

