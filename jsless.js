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
                if (jsless.log && method == "log") { window.console[method]("JSLess: " + message); }
                else if (jsless.debug && method == "debug") { window.console[method]("JSLess: " + message); }
                else { window.console[method]("JSLess: " + message); }
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
        log: false,
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
                    console.info("declared body as root widget");
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
                console.log("behavior: " + name + " processed in " + (new Date() - startTimer) + "ms"); startTimer = new Date();
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



/*!
 * JSLess Library - AJAX Invoke
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

    var ajaxResponse = function (invoker, XMLHttpRequest) {
        this.invoker = invoker;
        this.request = XMLHttpRequest;
        this.errormessage = null;
        this.success = true;

        if (XMLHttpRequest.status != 200) {
            this.errormessage = XMLHttpRequest.status + " Error: " + XMLHttpRequest.statusText;
            this.success = false;
        }
        var data = XMLHttpRequest.responseText;
        //var ct = request.XMLHttpRequest.getAllResponseHeaders("content-type") || "";
        //this.isHTML = ct.indexOf('html') > -1;
        this.isHTML = typeof data != "object";

        if (!this.isHTML) {
            data = fixDate(data);
            if (data.d) { //MS asmx wraps in a field of d, TODO: make sure this is the ONLY field before we do this
                data = data.d;
            }
        }
        this.data = data;
    }


    var fixDate = function (obj) {
        if (obj === null) {
            return obj;
        }

        // ASP.NET JSON date?
        if (typeof obj === "string") {
            var pattern = /\/Date\(\d+\)\//;
            var match = obj.match(pattern);

            // nope, regular string
            if (!match) {
                return obj;
            }

            var match = match[0].match(/\d+/);
            var number = parseInt(match[0]);

            // yup, JSON-serialized DateTime
            return new Date(number);
        }
        // string or number
        if (typeof obj !== "object") {
            return obj;
        }

        // array or object
        var self = $.proxy(fixDate, this);

        $.each(obj, function (key, val) {
            obj[key] = self(val);
        });

        return obj;
    }

    var invoke = function (options) {
        this.settings = $.extend({}, this.settings, options);
        if (this.settings.onComplete == null) {
            throw "missing option onComplete";
        }
        $(window).bind("invoke-abort", this.Abort);
        if (this.settings.category) {
            $(window).bind("invoke-abort-" + this.settings.category, this.Abort);
        }
        this._Start();
    }
    invoke.prototype = {
        settings: {
            url: null,
            category: "normal", //used to group calls to segment aborting if necessary
            datatype: "json",
            method: "GET",
            subdomain: null,
            params: null,
            onComplete: null,
            retryCount: 0
        },
        failCount: 0,
        _request: null,

        Retry: function () {
            this.Start();
        },
        _Start: function () {
            var _onComplete = function (XMLHttpRequest, textStatus) {
                this._running = false;
                //Session Timeout
                if (XMLHttpRequest.status == 401) {
                    console.warn("Attempted to access an UnAuthorized Page");
                    $(window).trigger("invoke-authorizationerror", this._request);
                    return;
                }
                var response = new ajaxResponse(this, XMLHttpRequest);
                if (response.errormessage) {
                    this.failCount++;
                }

                //var response = new invokeResponse(this, null, 
                this.settings.onComplete(response);
            }

            if (this._running) {
                return false;
            }
            this._running = true;
            this._request = null;

            var urlString = this.settings.url;
            var type = this.settings.method;

            var data = this.settings.params;
            var datatype = this.settings.datatype;
            if (this.settings.subdomain) {
                urlString = location.protocol + "//" + subDomain + "." + location.host + urlString;
                datatype = 'jsonp';
            }

            var formattedData = $.postify(data);
            var contentType = 'application/json; charset=utf-8';

            this._request = $.ajax({
                url: urlString,
                type: type,
                //contentType: contentType,
                dataType: datatype,
                data: formattedData,
                cache: false,
                traditional: true,
                complete: $.proxy(_onComplete, this)
            });
            return true;
        },

        //TODO
        Abort: function () {
            this.settings.onComplete = null;
            this.settings.onFail = null;
            this._running = false;
            if (this._request) {
                try {
                    //if ($.browser.msie == false) {
                    this._request.abort();
                    //}
                } catch (e) { }
            }

        }
    }


    // postify.js
    // Converts an object to an ASP.NET MVC  model-binding-friendly format
    // Author: Nick Riggs
    // http://www.nickriggs.com
    $.postify = function (value) {
        var result = {};
        var buildResult = function (object, prefix) {
            for (var key in object) {
                if (object[key] == null) {
                    object[key] = "";
                }
                var postKey = isFinite(key)
                ? (prefix != "" ? prefix : "") + "[" + key + "]"
                : (prefix != "" ? prefix + "." : "") + key;
                switch (typeof (object[key])) {
                    case "number": case "string": case "boolean":
                        result[postKey] = object[key];
                        break;
                    case "object":
                        if (object[key].toUTCString)
                            result[postKey] = object[key].toUTCString().replace("UTC", "GMT");
                        else {
                            buildResult(object[key], postKey != "" ? postKey : key);
                        }
                }
            }
        };
        buildResult(value, "");
        return result;
    };

    $.fn.jsless_invoke = function (options) {
        var request = jsless.invoke(options);
    }

    var _jsless = {
        invoke: function (options) {
            var invoker = new invoke(options);
            return invoker;
        }
    }

    console.info("Loading Invoke ...");
    window.jsless = $.extend(true, _jsless, window.jsless || {}); //extend allowing overrides;
}(window.jQuery);



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
            if (typeof selector === 'object' && !(selector instanceof jQuery)) {
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
                else if (settings.scope == "document") {
                    $scope = $(document);
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
                    var settings = {
                        target: val,
                        object: "jQuery",
                        method: "val",
                        methodparams: []
                    };
                    if (typeof val === 'object' && !(val instanceof jQuery)) {
                        $.extend(settings, val);
                    }
                    settings = jsless.getSelector(settings, $widget, $element);
                    dynamicParams[indx] = function () {
                        var $target = settings.getVal();
                        var object = $target;
                        if (settings.object != "jQuery") {
                            object = window[settings.object]; //todo handle .'s
                        }
                        var result = object[settings.method].apply($target, settings.methodparams);
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
                    onFail: null,
                    params: {
                        dynamic: {},
                        forms: []
                    }
                }, jsless.settings.method, options.method, behavior);
                if (!settings.url) {
                    console.error("html url not specified: " + JSON.stringify(settings));
                }
                if (!settings.onFail) {
                    settings.onFail = settings.onSuccess;
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
                    var $success = successSelector.getVal();
                    var $fail = failSelector.getVal();

                    var request = $element.triggerHandler("jsless-" + settings.name + "-begin"); // allow for intercept and termination (validation)
                    if (request === undefined || request) {
                        $element.trigger("jsless-ajax-begin");
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
                                var $targets = $success;
                                if (!ajaxResponse.success) {
                                    selector = failSelector;
                                    $targets = $fail;
                                    $element.trigger("jsless-ajax-beforefail");
                                    $targets.triggerHandler("jsless-" + settings.name + "-beforefail");
                                }
                                else {
                                    $element.trigger("jsless-ajax-beforesuccess");
                                    $targets.triggerHandler("jsless-" + settings.name + "-beforesuccess");
                                }
                                $element.trigger("jsless-ajax-beforecomplete");
                                $targets.triggerHandler("jsless-" + settings.name + "-beforecomplete");
                                $.each($targets, function (index, elem) {
                                    var $target = $(elem);
                                    var $data = $html.clone();
                                    $target[selector.mode]($data);
                                    $data.jsless(options);
                                });
                                if (ajaxResponse.success) {
                                    $element.trigger("jsless-ajax-success");
                                    $targets.triggerHandler("jsless-" + settings.name + "-success");
                                }
                                else {
                                    $element.trigger("jsless-ajax-fail");
                                    $targets.triggerHandler("jsless-" + settings.name + "-fail");
                                }
                                $element.trigger("jsless-ajax-complete");
                                $targets.triggerHandler("jsless-" + settings.name + "-complete");
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
                    onFail: null,
                    params: {
                        dynamic: {},
                        forms: []
                    }
                }, jsless.settings.method, options.method, behavior);

                if (settings.params.forms.length == 0) {
                    if ($element.is("form")) {
                        console.log("element is form");
                        settings.params.forms.push($element);
                    }
                    else {
                        var $form = $element.parentsUntil($widget, "form");
                        if ($form.length == 1) {
                            console.log("element is within form");
                        }
                        else {
                            console.log("element is formless");
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
                    console.debug(settings.name + " event:" + settings.event + " method: " + settings.method);
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

            }
        }
    }

    console.info("Loading Behaviors ...");
    window.jsless = $.extend(true, _jsless, window.jsless || {}); //extend allowing overrides;
}(window.jQuery);



