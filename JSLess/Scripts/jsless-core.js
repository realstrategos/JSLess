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

    window.console = window.console || { log: function () { }, error: function (e) { alert(e); }, info: function () { }, warn: function () { }, debug: function () { } };
    var consoleMethods = ["log", "error", "warn", "debug", "info"];
    var console = {};
    for (var cm in consoleMethods) {
        var method = consoleMethods[cm];
        console[method] = (function (method) {
            return function (message) {
                if (jsless.debug) { window.console[method]("JSLess: " + message); }
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
        debug: true,
        console: console
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
                    console.log("declared body as root widget");
                    $widget.attr("data-jsless-widget", "root");
                }
                else {
                    console.log("missing data-jsless-widget, treating as a partial");
                }
            }
            var $subWidgets = $element.find("[data-jsless-widget]");
            $subWidgets = $subWidgets.filter(function (index) {
                var temp = $(this).parentsUntil($element, "[data-jsless-widget]").length == 0;
                return temp;
            });
            var $targets = $element.find("[data-jsless]").addBack("[data-jsless]");
            $targets = $targets.filter(function (index) {
                var temp = $(this).parentsUntil($element.parent(), "[data-jsless-widget]").length <= 1;
                return temp;
            });
            console.log("found: " + $targets.length + " elements and " + $subWidgets.length + " sub widgets ...");

            $targets.each(function (tIndex, target) {
                var $target = $(target);
                //find my widget
                var behaviors = $.parseJSON($target.attr("data-jsless"));
                $(behaviors).each(function (index, behavior) {
                    jsless.processBehavior($widget, $target, behavior, settings);
                });
            });
            $subWidgets.each(function (tIndex, target) {
                console.log("processing subwidget ...");
                var $target = $(target);
                jsless.process($target, options, true);
            });

            if (!isSubWidget) {
                console.log("processed: " + behaviorCounter + " behaviors in " + (new Date() - initTimer) + "ms");
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
                    console.error("Behavior not found: " + name);
                    return;
                }
            }
            else {
                jsless.behaviors[name]($widget, $element, behavior, settings);
            }
            if (settings.debug) {
                console.debug("behavior: " + name + " processed in " + (new Date() - startTimer) + "ms"); startTimer = new Date();
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
            })
        }
    }

    console.info("Loading Core...");
    window.jsless = $.extend(true, _jsless, window.jsless || {}); //extend allowing overrides;
    setTimeout(function () {
        jsless.debug = false; //turn off debugging after load notices
    }, 0);
}(window.jQuery);

