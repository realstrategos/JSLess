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

    var logger = jsless.logger;

    var _jsless = {
        settings: {
            behavior: {
                name: null,
                event: 'click',
                eventSource: 'self',
                target: 'self',
                delay: -1,
                params: [],
                dynamic: [],
                stopEventPropagation: false
            }
        },
        behaviors: {
            execute: function ($widget, $element, behavior, options) {
                var settings = $.extend(true, {}, jsless.settings.behavior, options.behavior, {
                    name: 'execute',
                    object: "jQuery",
                    method: null
                }, behavior);
                if (!settings.method) {
                    logger.error("execute method not specified: " + JSON.stringify(settings));
                }

                var dynamicParams = {};
                $.each(settings.dynamic, function (indx, indxVal) {
                    if (settings.dynamic[indx] == null) {
                        return;
                    }
                    var compiled = jsless.compileParams({ dynamic: settings.dynamic[indx] }, $widget, $element);
                    dynamicParams[indx] = compiled;
                });
                var $eventSource = jsless.getSelector(settings.eventSource, $widget, $element).getVal();
                var targetSelector = jsless.getSelector(settings.target, $widget, $element);
                var onEvent = function (event, eventData) {
                    var params = settings.params.slice(0);
                    if (settings.stopEventPropagation) {
                        event.stopPropagation();
                    }
                    logger.debug(settings.name + " event:" + settings.event + " method: " + settings.method + "\r\n\t :: " + JSON.stringify(settings));
                    var request = $element.triggerHandler("jsless-" + settings.name + "-begin"); // allow for intercept and termination
                    if (request === undefined || request) {
                        var $target = targetSelector.getVal();
                        
                        $.each(dynamicParams, function (indx, indxVal) {
                            var val = jsless.getParams(dynamicParams[indx]);
                            if (typeof val === "object") {
                                //params[indx] = params[indx] || {};
                                $.extend(true, params, val);
                            }
                            else {
                                params[indx] = val;
                            }
                        });

                        var complete = function () {
                            $element.triggerHandler("jsless-" + settings.name + "-beforecomplete");
                            var object = $target;
                            var method = $target[settings.method];

                            $.each(params, function (indx, val) {
                                if (params[indx] == "@event") {
                                    params[indx] = event;
                                }
                                if (params[indx] == "@eventData") {
                                    params[indx] = eventData;
                                }
                                if (params[indx] == "@target") {
                                    params[indx] = $target;
                                }
                            });
                            if (settings.object != "jQuery") {
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
                    $eventSource.bind(settings.event, onEvent);
                }
            },
            keyclick: function ($widget, $element, behavior, options) {
                /*
                /* Used to bind a keydown event (default is enter key) to fire a click event on the given target(s)
                */
                var settings = $.extend(true, {}, jsless.settings.behavior, options.behavior, {
                    name: 'keyclick',
                    event: 'keydown',
                    target: 'self',
                    keycode: 13
                }, behavior);

                var params = settings.params;
                var $eventSource = jsless.getSelector(settings.eventSource, $widget, $element).getVal();
                var targetSelector = jsless.getSelector(settings.target, $widget, $element);
                $eventSource.bind(settings.event, function (event) {
                    logger.debug(settings.name + " event:" + settings.event + "\r\n\t :: " + JSON.stringify(settings));
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
                var settings = $.extend(true, {}, jsless.settings.behavior, options.behavior, {
                    name: 'toggleClass',
                    className: null
                }, behavior);
                if (!settings.className) {
                    logger.error("className not specified: " + JSON.stringify(settings));
                }
                var params = settings.params;
                var $eventSource = jsless.getSelector(settings.eventSource, $widget, $element).getVal();
                var targetSelector = jsless.getSelector(settings.target, $widget, $element);
                $eventSource.bind(settings.event, function (event) {
                    logger.debug(settings.name + " event:" + settings.event + "\r\n\t :: " + JSON.stringify(settings));
                    var request = $element.triggerHandler("jsless-" + settings.name + "-begin"); // allow for intercept and termination
                    if (request === undefined || request) {
                        var $target = targetSelector.getVal();//THIS IS THE TARGET COLLECTION OF CHILDREN, I.E. <li>'s
                        var $source = $(event.target).parents(settings.target).addBack(settings.target).first();
                        var className = settings.className;

                        $target.removeClass(className);
                        $source.addClass(className);
                    }
                });
            },
            parentTrigger: function ($widget, $element, behavior, options) {
                var settings = $.extend(true, {}, jsless.settings.behavior, options.method, {
                    name: 'parentTrigger',
                    eventSource: 'widget',
                    parentSelector: '[data-jsless-widget]',
                    parentEvent: 'jsless-reload',
                    level: 1
                }, behavior);

                var $sourceSelector = jsless.getSelector(settings.eventSource, $widget, $element).getVal();
                var onEvent = function (event, eventData) {
                    var $parent = $sourceSelector;
                    if (settings.level > 0) {
                        $parent = $($parent.parents(settings.parentSelector)[settings.level - 1]);
                    }
                    $parent.triggerHandler(settings.parentEvent, eventData);
                }
                if (settings.event == "load") {
                    $widget.one("jsless-widget-complete", onEvent);
                }
                else {
                    $sourceSelector.bind(settings.event, onEvent);
                }
            }
        }
    }

    logger.info("Loading Behaviors ...");
    window.jsless = $.extend(true, _jsless, window.jsless || {}); //extend allowing overrides;
}(window.jQuery);

