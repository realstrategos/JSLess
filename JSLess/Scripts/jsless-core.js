/*!
 * JSLess Library - Core
 * https://github.com/realstrategos/JSLess
 * *
 * Copyright 2013 OptixConnect LLC and other contributors
 * Released under the Creative Commons Attribution NonCommercial (CC-NC)
 * http://creativecommons.org/licenses/by-nc/3.0/legalcode
 *
 */

!function ($) {
    "use strict"; // jshint ;_;

    if (!window.console) {
        window.console = {};
    }
    // union of Chrome, FF, IE, and Safari console methods
    var m = [
      "log", "info", "warn", "error", "debug", "trace", "dir", "group",
      "groupCollapsed", "groupEnd", "time", "timeEnd", "profile", "profileEnd",
      "dirxml", "assert", "count", "markTimeline", "timeStamp", "clear"
    ];
    // define undefined methods as noops to prevent errors    
    for (var i = 0; i < m.length; i++) {
        if (!window.console[m[i]]) {
            if (m[i] == "error") {
                window.console[m[i]] = function (e) { alert(e); }
            }
            window.console[m[i]] = function () { };
        }
    }
    var logger = {};
    var consoleMethods = ["log", "error", "warn", "debug", "info"];    
    for (var cm in consoleMethods) {
        var method = consoleMethods[cm];
        logger[method] = (function (method) {
            return function (message) {
                if (method == "log") { if (jsless.log) console[method]("JSLess: " + message); }
                else if (method == "debug") { if (jsless.debug) console[method]("JSLess: " + message); }
                else { console[method]("JSLess: " + message); }
            }
        })(method);
    }

    function getSubWidgets($source, filter) {
        var xElements = [];
        $source.find(filter).each(function (i, el) {
            if ($(el).parentsUntil($source, filter).length == 0)
                xElements.push(el);
        });
        return $(xElements);
    }
    var startTimer = new Date();
    var behaviorCounter = 0;

    window.jsless = $.extend(true, {
        debug: false,
        log: false,
        logger: logger
    }, window.jsless || {});
    var _jsless = {
        settings: {
            selector: {
                target: "self",
                scope: "widget",
                latebind: true
            }
        },
        behaviors: {},
        _methods: {},
        process: function ($element, options, isSubWidget) {
            if ($element.is("script")) {
                return;
            }
            if (options && options.debug) {
                jsless.debug = options.debug;
            }
            if (options) {
                $element.data("jsless-options", options);
            }
            var settings = $.extend(true, {}, this.settings, options);
            var initTimer = new Date();
            if (!isSubWidget) {
                behaviorCounter = 0;
                startTimer = initTimer;
            }

            var $widget = $element;
            if (!$element.attr("data-jsless-widget")) { //is not a full widget, likely a paged result
                $widget = $element.parents("[data-jsless-widget]").first();
                if ($widget.length == 0) { //no widget declared, body is outermost widget
                    $widget = $("body");
                    logger.info("declared body as root widget");
                    $widget.attr("data-jsless-widget", "root");
                }
                else {
                    logger.log("missing data-jsless-widget, treating as a partial");
                }
            }
            var widgetID = $widget.attr("data-jsless-widget");
            var $subWidgets = $element.find("[data-jsless-widget]");
            $subWidgets = $subWidgets.filter(function (index) {
                var temp = $(this).parentsUntil($element, "[data-jsless-widget]").length == 0;
                return temp;
            });
            var $targets = $element.find("[data-jsless]:not([data-jsless-widget])").addBack("[data-jsless]");
            $targets = $targets.filter(function (index) {
                var temp = $(this).parentsUntil($element.parent(), "[data-jsless-widget][data-jsless-widget!=" + widgetID + "]").length == 0;
                return temp;
            });
            logger.log("found: " + $targets.length + " elements and " + $subWidgets.length + " sub widgets ...");

            $targets.each(function (tIndex, target) {
                var $target = $(target);
                //find my widget
                var behaviors = $.parseJSON($target.attr("data-jsless"));
                $(behaviors).each(function (index, behavior) {
                    jsless.processBehavior($widget, $target, behavior, settings);
                });
            });
            $subWidgets.each(function (tIndex, target) {
                logger.log("processing subwidget ...");
                var $target = $(target);
                jsless.process($target, options, true);
            });

            if (!isSubWidget) {
                logger.log("processed: " + behaviorCounter + " behaviors in " + (new Date() - initTimer) + "ms");
            }
            $widget.triggerHandler("jsless-widget-complete");
            $widget.trigger("jsless-widget-loaded");
        },
        processBehavior: function ($widget, $element, behavior, settings) {
            behaviorCounter++;
            var name = behavior.name;
            if (jsless.behaviors[name] === undefined) {
                if (name == "html" || name == "htmlform") { // allow override of methods
                    jsless._methods[name]($widget, $element, behavior, settings);
                }
                else {
                    logger.error("Behavior not found: " + name);
                    return;
                }
            }
            else {
                jsless.behaviors[name]($widget, $element, behavior, settings);
            }
            if (settings.debug) {
                logger.debug("behavior: " + name + " processed in " + (new Date() - startTimer) + "ms"); startTimer = new Date();
            }
        }
    }

    $.fn.jsless = function (options) {
        return this.each(function () {
            var $this = $(this)
            jsless.process($this, options);
        })
    }

    if ($.fn.toggleProp === undefined) {
        $.fn.toggleProp = function (propName) {
            return this.each(function () {
                var $this = $(this)
                $this.prop(propName, !$this.prop(propName));
                if ($this.is("input[type=checkbox]") && propName == "checked") {
                    setTimeout(function () {
                        $this.trigger("change");
                    }, 0);
                }
            })
        }
    }

    logger.info("Loading Core...");
    window.jsless = $.extend(true, _jsless, window.jsless || {}); //extend allowing overrides;
    setTimeout(function () {
        jsless.debug = false; //turn off debugging after load notices
    }, 0);
}(window.jQuery);

