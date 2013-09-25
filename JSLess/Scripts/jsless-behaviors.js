/*!
 * JSLess Library - Builtin Behaviors
 * https://github.com/realstrategos/JSLess
 * *
 * Copyright 2013 OptixConnect LLC and other contributors
 * Released under the Creative Commons Attribution NonCommercial (CC-NC)
 * http://creativecommons.org/licenses/by-nc/3.0/legalcode
 *
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
                var onEvent = function (event) {
                    console.debug(settings.name + " event:" + settings.event + " method: " + settings.method + "\r\n\t :: " + JSON.stringify(settings));
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
                };
                if (settings.event == "load") {
                    $widget.one("jsless-widget-complete", onEvent);
                }
                else {
                    $element.bind(settings.event, onEvent);
                }
            },
            keyclick: function ($widget, $element, behavior, options) {
                /*
                /* Used to bind a keydown event (default is enter key) to fire a click event on the given target(s)
                */
                var settings = $.extend(true, {
                    name: 'keyclick',
                    event: 'keydown',
                    target: 'self',
                    keycode: 13
                }, jsless.settings.behavior, options.behavior, behavior);

                var params = settings.params;
                var $eventSource = jsless.getSelector(settings.eventSource, $widget, $element).getVal();
                var targetSelector = jsless.getSelector(settings.target, $widget, $element);
                $eventSource.bind(settings.event, function (event) {
                    console.debug(settings.name + " event:" + settings.event + "\r\n\t :: " + JSON.stringify(settings));
                    var request = $element.triggerHandler("jsless-" + settings.name + "-begin"); // allow for intercept and termination
                    if (request === undefined || request) {
                        var code = (event.keyCode ? event.keyCode : event.which);
                        if (code == settings.keycode) {
                            event.preventDefault();
                            var $targets = targetSelector.getVal();
                            $targets.triggerHandler("click");
                        }
                    }
                });
            },
            toggleClass: function ($widget, $element, behavior, options) {
                /*
                /* Used to add a class to the given eventSource and remove from the target(s) (aka menu selector)
                */
                var settings = $.extend(true, {
                    name: 'toggleClass',
                    className: null
                }, jsless.settings.behavior, options.behavior, behavior);
                if (!settings.className) {
                    console.error("className not specified: " + JSON.stringify(settings));
                }
                var params = settings.params;
                var $eventSource = jsless.getSelector(settings.eventSource, $widget, $element).getVal();
                var targetSelector = jsless.getSelector(settings.target, $widget, $element);
                $eventSource.bind(settings.event, function (event) {
                    console.debug(settings.name + " event:" + settings.event + "\r\n\t :: " + JSON.stringify(settings));
                    var request = $element.triggerHandler("jsless-" + settings.name + "-begin"); // allow for intercept and termination
                    if (request === undefined || request) {
                        var $target = targetSelector.getVal();//THIS IS THE TARGET COLLECTION OF CHILDREN, I.E. <li>'s
                        var $source = $(event.target).parents(settings.target).addBack(settings.target).first();
                        var className = settings.className;

                        $target.removeClass(className);
                        $source.addClass(className);
                    }
                });
            }
        }
    }

    console.info("Loading Behaviors ...");
    window.jsless = $.extend(true, _jsless, window.jsless || {}); //extend allowing overrides;
}(window.jQuery);

