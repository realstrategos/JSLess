/*!
 * JSLess Library - Builtin Methods
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
            method: {
                name: null,
                onSuccess: "widget",
                onFail: "widget",
                params: {
                    dynamic: {},
                    forms: []
                }
            }
        },
        getSelector: function (selector, $widget, $element) {
            if (selector == null) {
                throw "selector is null";
            }

            var $val = null;
            var settings = {
                target: null,
                scope: "widget",
                latebind: true,
                mode: "html",
                getVal: function () {
                    return $val;
                }
            }
            if (typeof selector === 'object' && !selector instanceof jQuery) {
                $.extend(settings, selector);
            }
            else {
                settings.target = selector;
            }
            var locator = function () {
                var $scope = null;
                if (settings.scope == "widget") {
                    $scope = $widget;
                }
                else if (settings.scope == "self") {
                    $scope = $element;
                }
                else {
                    $scope = $(settings.scope);
                }

                var $target = $scope;
                if (settings.target != null) {
                    $target = $scope.find(settings.target);
                }
                return $target;
            }
            if (selector == "self") {
                $val = $element;
            }
            else if (selector == "widget") {
                $val = $widget;
            }
            else if (settings.latebind) {
                settings.getVal = locator;
            }
            else {
                $val = locator();
            }
            return settings;
        },
        compileParams: function (originalParams, $widget, $element) { //compile the parameters
            var params = $.extend({}, originalParams);
            if (params.dynamic) {
                var dynamicParams = {};
                $.each(params.dynamic, function (indx, val) {
                    var settings = $.extend({
                        target: null,
                        object: "jQuery",
                        method: "val",
                        methodparams: ["value"]
                    }, val);
                    settings = jsless.getSelector(settings, $widget, $element);
                    dynamicParams[indx] = function () {
                        var $target = settings.getVal();
                        var object = window[settings.object];
                        var result = object[method].apply($target, settings.methodparams);
                        return result;
                    }
                });
                params.dynamic = dynamicParams;
            }
            if (params.forms) {
                var forms = [];
                $.each(params.forms, function (indx, val) {
                    var form = jsless.getSelector(val, $widget, $element);
                    forms.push(form);
                });
                params.forms = forms;
            }
            return params;
        },
        getParams: function (compiledParams) { //runtime evalution
            var params = $.extend({}, compiledParams);

            var dynamicParams = {};
            if (params.dynamic) {
                $.each(params.dynamic, function (indx, val) {
                    dynamicParams[indx] = val();
                });
                delete params.dynamic;
            }
            var forms = {};
            if (params.forms) {
                $.each(params.forms, function (indx, form) {
                    var $form = form.getVal();
                    var formValues = jsless.processContainer($form);
                    $.extend(forms, formValues);
                });
                delete params.forms;
            }
            var temp = {};
            $.each(params, function (indx, val) {
                var name = indx;
                if (indx.indexOf("_dynamic") > 0 || indx.indexOf("_forms") > 0) {
                    name = indx.substr(1);
                }
                temp[name] = val;
            });

            var result = $.extend({}, forms, dynamicParams, temp);
            return result;
        },
        getValue: function ($element, result, name) {
            if ($element.attr("contenteditiable") != null) {
                result[name] = $element.html();
            }
            else if ($element.is("select[multiple] option:selected")) {
                result[name] = result[name] || [];
                result[name].push($element.val());
            }
            else if ($element.is("input[data-list]:checkbox")) {
                result[name] = result[name] || [];
                if ($element.is(":checked")) {
                    result[name].push($element.val());
                }
            }
            else if ($element.is("input:checkbox,input:radio")) {
                if ($element.is("input[value]")) {
                    if ($element.is(":checked")) {
                        result[name] = $element.val();
                    }
                }
                else {
                    result[name] = $element.is(":checked");
                }
            }
            else if ($element.is("option:selected")) {
                result[name] = $element.val();
            }
            else if ($element.is("select")) {
                $element.find("option:selected").each(function (index, item) {
                    result = jsless.getValue($(item), result, name);
                });
            }
            else {
                result[name] = $element.val();
            }
            return result;
        },
        processContainer: function ($container) {
            var complex = "[name],[data-list]";
            var simple = "input[type!='button'][type!='submit'],select,textarea,[contenteditable]";

            //get toplevel elements
            var $elements = $container.find(complex + "," + simple).filter(function (index) {
                var temp = $(this).parentsUntil($container, complex).length == 0;
                return temp;
            });
            var $simple = $elements.filter(simple);
            var $complex = $elements.not($simple);

            var result = {};
            $.each($simple, function (index, element) {
                var $element = $(element);
                var name = $element.attr("name");
                if ($element.attr("data-list")) {
                    name = $element.attr("data-list");
                }
                else if ($element.attr("data-index") != null) {
                    name += "[" + $element.attr("data-index") + "]";
                }
                if (name == null) {
                    console.warn("element has no name: " + $element[0].outerHTML);
                    return;
                }
                var temp = jsless.getValue($element, result, name);
                result = temp;
            });

            $.each($complex, function (index, element) {
                var $element = $(element);
                var temp = jsless.processContainer($element);

                if ($element.attr("data-list") != null) {
                    var name = $element.attr("data-list");
                    result[name] = result[name] || [];
                    result[name].push(temp);
                }
                else {
                    var name = $element.attr("name");
                    if ($element.attr("data-index") != null) {
                        name += "[" + $element.attr("data-index") + "]";
                    }
                    result[name] = temp;
                }
            });

            return result;
        },
        _methods: {
            html: function ($widget, $element, behavior, options) {
                var settings = $.extend(true, {
                    name: 'html',
                    url: null,
                    method: 'GET',
                    event: 'click',
                    eventstop: false,
                    onSuccess: 'widget',
                    onFail: 'widget',
                    params: {
                        dynamic: {},
                        forms: []
                    }
                }, jsless.settings.method, options.method, behavior);
                if (!settings.url) {
                    console.error("html url not specified: " + JSON.stringify(settings));
                }
                var successSelector = jsless.getSelector(settings.onSuccess, $widget, $element);
                var failSelector = jsless.getSelector(settings.onFail, $widget, $element);
                var compiledParams = jsless.compileParams(settings.params, $widget, $element);
                var onEvent = function (event) {
                    console.debug(settings.name + " event:" + settings.event);
                    if (settings.eventstop && settings.event != "load") {
                        event.preventDefault(); //prevent form submit
                    }
                    var params = jsless.getParams(compiledParams);
                    $element.trigger("jsless-ajax-begin");
                    var request = $element.triggerHandler("jsless-" + settings.name + "-begin"); // allow for intercept and termination (validation)
                    if (request === undefined || request) {
                        jsless.invoke({
                            url: settings.url,
                            category: "normal", //used to group calls to segment aborting if necessary
                            datatype: "json",
                            method: settings.method,
                            subdomain: null,
                            params: params,
                            onComplete: function (ajaxResponse) {
                                ajaxResponse.success = ajaxResponse.success && ajaxResponse.isHTML;
                                var $html = $(ajaxResponse.data);
                                if ($html.attr("data-jsless-error")) {
                                    ajaxResponse.success = false;
                                    ajaxResponse.errormessage = $html.attr("data-jsless-error");
                                }

                                var selector = successSelector;
                                if (!ajaxResponse.success) {
                                    $element.trigger("jsless-ajax-beforefail");
                                    $element.triggerHandler("jsless-" + settings.name + "-beforefail");
                                    selector = failSelector;
                                }
                                else {
                                    $element.trigger("jsless-ajax-beforesuccess");
                                    $element.triggerHandler("jsless-" + settings.name + "-beforesuccess");
                                }
                                $element.trigger("jsless-ajax-beforecomplete");
                                $element.triggerHandler("jsless-" + settings.name + "-beforecomplete");
                                var $targets = selector.getVal();
                                $.each($targets, function (index, elem) {
                                    var $target = $(elem);
                                    var $data = $html.clone();
                                    $target[selector.mode]($data);
                                    $data.jsless(options);
                                });

                                if (ajaxResponse.success) {
                                    $element.trigger("jsless-ajax-success");
                                    $element.triggerHandler("jsless-" + settings.name + "-success");
                                }
                                else {
                                    $element.trigger("jsless-ajax-fail");
                                    $element.triggerHandler("jsless-" + settings.name + "-fail");
                                }
                                $element.trigger("jsless-ajax-complete");
                                $element.triggerHandler("jsless-" + settings.name + "-complete");
                            },
                            retryCount: 0
                        });
                    }
                }
                if (settings.event == "load") {
                    $widget.one("jsless-widget-complete", onEvent);
                }
                else {
                    $element.bind(settings.event, onEvent);
                }
            },
            htmlform: function ($widget, $element, behavior, options) {
                var settings = $.extend(true, {
                    name: 'html',
                    url: null,
                    method: 'GET',
                    event: $element.is("form") ? 'submit' : 'click',
                    eventstop: $element.is("form"),
                    onSuccess: 'widget',
                    onFail: 'widget',
                    params: {
                        dynamic: {},
                        forms: []
                    }
                }, jsless.settings.method, options.method, behavior);

                if (settings.params.forms.length == 0) {
                    if ($element.is("form")) {
                        console.debug("element is form");
                        settings.params.forms.push($element);
                    }
                    else {
                        var $form = $element.parentsUntil($widget, "form");
                        if ($form.length == 1) {
                            console.debug("element is within form");
                        }
                        else {
                            console.debug("element is formless");
                            $form = $element;
                        }
                        settings.params.forms.push($form);
                    }
                }
                jsless._methods.html($widget, $element, settings, options);
            }
        }
    }
    console.info("Loading Methods ...");
    window.jsless = $.extend(true, _jsless, window.jsless || {}); //extend allowing overrides;
}(window.jQuery);

