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
                var rawBehavior = $target.attr("data-jsless");
                var behaviors = [];
                if (rawBehavior.indexOf('[{"') == 0) {
                    behaviors = $.parseJSON(rawBehavior);
                }
                else {//need threat assesment on this
                    var checkMe = eval(rawBehavior);
                    if (Object.prototype.toString.call(checkMe) === '[object Array]') {
                        behaviors = checkMe;
                    }
                }
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

    var logger = jsless.logger;

    var transport = function (options) {
        //var contentType = 'application/json; charset=utf-8';
        var settings = $.extend({}, options, {
            data: $.postify(options.data),
            traditional: true
            //, converters: {
            //    "text json": function (result) {
            //        var data = $.parseJSON(result, true);
            //        if (data.d && Object.keys(data).length == 1) { //MS asmx wraps in a field of d, TODO: make sure this is the ONLY field before we do this
            //            data = data.d;
            //        }
            //        return data;
            //    }
            //}
        });
        if (settings.subdomain) {
            settings.url = location.protocol + "//" + settings.subdomain + "." + location.host + settings.url;
            settings.datatype = 'jsonp';
        }
        var _request = $.ajax(settings);
        return _request;
    }

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
        this.isHTML = true;
        if (XMLHttpRequest.responseJSON) {
            this.isHTML = false;
            data = XMLHttpRequest.responseJSON;
        }
        if (!this.isHTML) {
            if (data.d && Object.keys(data).length == 1) { //MS asmx wraps in a field of d, TODO: make sure this is the ONLY field before we do this
                data = data.d;
            }
        }
        this.data = data;
    }

    // From https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/keys
    if (!Object.keys) {
        Object.keys = (function () {
            'use strict';
            var hasOwnProperty = Object.prototype.hasOwnProperty,
                hasDontEnumBug = !({ toString: null }).propertyIsEnumerable('toString'),
                dontEnums = [
                  'toString',
                  'toLocaleString',
                  'valueOf',
                  'hasOwnProperty',
                  'isPrototypeOf',
                  'propertyIsEnumerable',
                  'constructor'
                ],
                dontEnumsLength = dontEnums.length;

            return function (obj) {
                if (typeof obj !== 'object' && (typeof obj !== 'function' || obj === null)) {
                    throw new TypeError('Object.keys called on non-object');
                }

                var result = [], prop, i;

                for (prop in obj) {
                    if (hasOwnProperty.call(obj, prop)) {
                        result.push(prop);
                    }
                }

                if (hasDontEnumBug) {
                    for (i = 0; i < dontEnumsLength; i++) {
                        if (hasOwnProperty.call(obj, dontEnums[i])) {
                            result.push(dontEnums[i]);
                        }
                    }
                }
                return result;
            };
        }());
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
                    logger.warn("Attempted to access an UnAuthorized Page");
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
                        
            this._request = jsless.transport({
                url: this.settings.url,
                type: this.settings.method,
                //contentType: contentType,
                dataType: this.settings.datatype,
                data: this.settings.params,
                cache: false,                
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
        , transport: transport
    }

    logger.info("Loading Invoke ...");
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

    var logger = jsless.logger;

    var _jsless = {
        settings: {
            method: {
                name: null,
                onSuccess: "widget",
                onFail: "widget",
                eventSource: 'self',
                requireEnabled: false,
                delay: -1,
                params: {
                    dynamic: {},
                    forms: []
                }
            }
        },
        dataMap: function (keys, data, deepCopy) {
            var result = {}, key, temp, tResult;
            for (key in keys) {
                temp = key in data ? data[key] : null;
                if (deepCopy && temp != null && typeof temp === 'object' && typeof keys[key] === 'object' && !(temp instanceof jQuery)) {
                    temp = jsless.dataMap(keys[key], temp, deepCopy);
                }

                var transformTarget = keys[key];
                var obj = result;
                var name = null;
                $.each(transformTarget.split("."), function (objIndx, objName) {
                    if (name != null) {
                        obj = obj[name];
                    }
                    if (obj[objName] === undefined) {
                        obj[objName] = {};
                    }
                    name = objName;
                });
                if (typeof temp === 'object') {
                    var rTemp = obj[name];
                    obj[name] = $.extend(true, {}, rTemp, temp);
                }
                else {
                    obj[name] = temp;
                }

            }
            return result
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
                else if (settings.scope == "parents") {
                    $scope = $element.parents();
                }
                else {
                    $scope = $(settings.scope);
                }

                var $target = $scope;
                if (settings.target != null) {
                    $target = $scope.find(settings.target);
                }
                if (selector == "form") {
                    $target = $element.parents("form").first();
                }
                return $target;
            }
            if (selector == "self") {
                $val = $element;
            }
            else if (selector == "widget") {
                settings.mode = "replaceWith";
                $val = $widget;
            }
            else if (selector == "body") {
                $val = $("body");
            }
            else if (selector == "document") {
                $val = $(document);
            }
            else if (selector == "window") {
                $val = $(window);
            }
            else if (selector == "form") {
                $val = $element.parents("form").first();
            }
            else if (selector == "empty") {
                $val = $("<div></div>");
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
                        name: null,
                        target: val,
                        object: "jQuery",
                        method: "val",
                        methodparams: []
                    };
                    if (typeof val === 'object' && !(val instanceof jQuery)) {
                        $.extend(settings, val);
                    }
                    settings = jsless.getSelector(settings, $widget, $element);
                    var name = settings.name || indx;
                    dynamicParams[name] = function () {
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
        getParams: function (compiledParams, $widget, $element) { //runtime evalution
            var params = $.extend({}, compiledParams);

            var dynamicParams = {};
            if (params.dynamic) {
                $.each(params.dynamic, function (indx, val) {
                    var obj = dynamicParams;
                    var name = null;
                    $.each(indx.split("."), function (objIndx, objName) {
                        if (name != null) {
                            obj = obj[name];
                        }
                        if (obj[objName] === undefined) {
                            obj[objName] = {};
                        }
                        name = objName;
                    });
                    obj[name] = val();
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
                if (typeof val == 'function') {
                    temp[name] = val({ widget: $widget, element: $element });
                }
                else {
                    temp[name] = val;
                }
            });

            var result = $.extend(true, {}, forms, temp, dynamicParams);
            return result;
        },
        getValue: function ($element, result, name) {
            var getVal = function () {
                var val = null;
                if ($element.is("select")) {
                    $element.find("option:selected").each(function (index, item) {
                        result = jsless.getValue($(item), result, name);
                    });
                }
                else if ($element.attr("contenteditable") != null) {
                    val = $element.html();
                }
                else if ($element.is("input:checkbox")) {
                    if ($element.is(":checked")) {
                        val = $element.val();
                        if (!$element.is("input[value]")
                            || val == "on" //IE 10 hack because inputs always have value as an attribute
                            ) {
                            val = true;
                        }
                    }
                }
                else if ($element.is("input:radio")) {
                    if ($element.is(":checked")) {
                        val = $element.val();
                    }
                }
                else {
                    val = $element.val();
                }
                return val;
            }

            var data = getVal();
            if (data != null) {
                if ($element.is("[data-type='enum'],[data-commalist]")) {
                    var temp = result[name] || "";
                    if (!$element.is("input:checkbox,input:radio") || $element.is(":checked")) {
                        if (temp.length > 0) {
                            temp += ", ";
                        }
                        temp += data;
                    }
                    data = temp;
                }
                if ($element.is("[data-index]")) {
                    result[name] = data;
                }
                else if ($element.is("[data-list]") || $element.is("select[multiple] option:selected")) {
                    result[name] = result[name] || [];
                    result[name].push(data);
                }
                else {
                    result[name] = data;
                }
            }
            return result;
        },
        processContainer: function ($container, indexName) {
            var complex = "[name],[data-list],[data-index]";
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

                var name = indexName;
                if ($element.attr("data-list")) {
                    name = $element.attr("data-list");
                }
                if ($element.attr("data-name")) {
                    name = $element.attr("data-name");
                }
                if ($element.attr("data-index") != null) {
                    name = (name || "") + "[" + $element.attr("data-index") + "]";

                }
                if (!name) {
                    name = $element.attr("name");
                }
                if (name == null) {
                    logger.warn("element has no name: " + $element[0].outerHTML);
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
                    if (!jQuery.isEmptyObject(temp)) {
                        if ($element.attr("data-index") != null) {
                            name = (name || "") + "[" + $element.attr("data-index") + "]";
                            $.extend(result, jsless.processContainer($element, name));
                        }
                        else {
                            result[name] = result[name] || [];
                            result[name].push(temp);
                        }
                    }
                }
                else {
                    var name = $element.attr("name");
                    if ($element.attr("data-index") != null) {
                        name += "[" + $element.attr("data-index") + "]";
                    }
                    if (result[name]) {
                        temp = $.extend({}, result[name], temp)
                    }
                    result[name] = temp;
                }
            });

            return result;
        },
        _methods: {
            html: function ($widget, $element, behavior, options) {
                var settings = $.extend(true, {}, jsless.settings.method, options.method, {
                    name: 'html',
                    url: null,
                    method: 'GET',
                    event: 'click',
                    stopEventPropagation: false,
                    onSuccess: 'widget',
                    onFail: null,
                    params: {
                        dynamic: {},
                        forms: []
                    }
                }, behavior);
                if (!settings.url) {
                    logger.error("html url not specified: " + JSON.stringify(settings));
                }
                if (!settings.onFail) {
                    settings.onFail = settings.onSuccess;
                }
                var $source = jsless.getSelector(settings.eventSource, $widget, $element).getVal();
                var successSelector = jsless.getSelector(settings.onSuccess, $widget, $element);
                var failSelector = jsless.getSelector(settings.onFail, $widget, $element);
                var compiledParams = jsless.compileParams(settings.params, $widget, $element);

                var onEvent = function (event, eventData) {
                    if (!settings.requireEnabled || $source.is(":enabled")) {
                        settings.eventData = eventData;
                        jsless._methods.htmlevent(event, $widget, $element, settings, successSelector, failSelector, compiledParams, options);
                    }
                }
                if (settings.event == "load") {
                    $widget.one("jsless-widget-complete", onEvent);
                }
                else {
                    $source.bind(settings.event, onEvent);
                }
            },
            htmlevent: function (event, $widget, $element, settings, successSelector, failSelector, compiledParams, options) {
                var logMessage = ""; //try { var logMessage = JSON.stringify(settings); } catch (ex) { }
                logger.debug(settings.name + " event:" + settings.event + "\r\n\t :: " + logMessage);
                if (settings.stopEventPropagation && settings.event != "load") {
                    event.preventDefault(); //prevent form submit
                }
                var params = jsless.getParams(compiledParams, $widget, $element);
                var $success = successSelector.getVal();
                var $fail = failSelector.getVal();

                if (settings.loading) {
                    var renderSheen = function ($source) {
                        var $sheen = $($(settings.loading).html());
                        $sheen.width($source.width());
                        $sheen.height($source.height());
                        $sheen.css("left", $source[0].offsetLeft);
                        $sheen.css("top", $source[0].offsetTop);
                        $source.append($sheen);
                        $sheen.show();
                        $element.bind("jsless-ajax-beforecomplete", function () {
                            $sheen.remove();
                        });
                    }
                    renderSheen($success);
                }

                if (settings.eventDataMap && settings.eventData) {
                    var eventData = jsless.dataMap(settings.eventDataMap, settings.eventData);
                    $.extend(params, eventData);
                }

                var request = $element.triggerHandler("jsless-" + settings.name + "-begin", [compiledParams]); // allow for intercept and termination (validation)
                if (request === undefined || request) {
                    $element.trigger("jsless-ajax-begin");
                    $success.triggerHandler("jsless-" + settings.name + "-beforestart");
                    $fail.triggerHandler("jsless-" + settings.name + "-beforestart");
                    var ajaxSettings = {
                        url: settings.url,
                        category: "normal", //used to group calls to segment aborting if necessary
                        datatype: "json",
                        method: settings.method,
                        subdomain: null,
                        params: params,
                        onComplete: function (ajaxResponse) {
                            ajaxResponse.success = ajaxResponse.success && ajaxResponse.isHTML;
                            var $html = $(ajaxResponse.data);
                            var eventParams = jsless.processContainer($html.find("[data-jsless-params]"));
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
                                $targets.triggerHandler("jsless-" + settings.name + "-beforefail", [eventParams]);
                            }
                            else {
                                $element.trigger("jsless-ajax-beforesuccess");
                                $targets.triggerHandler("jsless-" + settings.name + "-beforesuccess", [eventParams]);
                            }
                            $element.trigger("jsless-ajax-beforecomplete");
                            $targets.triggerHandler("jsless-" + settings.name + "-beforecomplete", [eventParams]);
                            setTimeout(function () {
                                $.each($targets, function (index, elem) {
                                    var $target = $(elem);
                                    if ($target.parents("body").length != 0) {
                                        var $data = $html.clone();
                                        $target[selector.mode]($data);
                                        $data.jsless(options);
                                    }
                                });
                                setTimeout(function () {
                                    if (ajaxResponse.success) {
                                        $element.trigger("jsless-ajax-success");
                                        $targets.triggerHandler("jsless-" + settings.name + "-success", [eventParams]);
                                    }
                                    else {
                                        $element.trigger("jsless-ajax-fail");
                                        $targets.triggerHandler("jsless-" + settings.name + "-fail", [eventParams]);
                                    }
                                    $element.trigger("jsless-ajax-complete");
                                    $targets.triggerHandler("jsless-" + settings.name + "-complete", [eventParams]);
                                }, 0);
                            }, 0);
                        },
                        retryCount: 0
                    };
                    var start = function () {
                        if ($success.parents("body").length == 0 && successSelector.target != "empty") {
                            logger.debug(settings.name + " event:" + settings.event + "\r\n\t :: $success is detached");
                            return;
                        }
                        jsless.invoke(ajaxSettings);
                    }
                    if (settings.delay < 0) {
                        start();
                    }
                    else {
                        setTimeout(start, settings.delay);
                    }
                }
            },
            htmlform: function ($widget, $element, behavior, options) {
                var settings = $.extend(true, {}, jsless.settings.method, options.method, {
                    name: 'html',
                    url: null,
                    method: 'GET',
                    event: $element.is("form") ? 'submit' : 'click',
                    stopEventPropagation: $element.is("form"),
                    onSuccess: 'widget',
                    onFail: null,
                    params: {
                        dynamic: {},
                        forms: []
                    }
                }, behavior);

                if (settings.params.forms.length == 0) {
                    if ($element.is("form")) {
                        logger.log("element is form");
                        settings.params.forms.push($element);
                    }
                    else {
                        var $form = $element.parentsUntil($widget, "form");
                        if ($form.length == 1) {
                            logger.log("element is within form");
                        }
                        else {
                            logger.log("element is formless");
                            $form = $element;
                        }
                        settings.params.forms.push($form);
                    }
                }
                jsless._methods.html($widget, $element, settings, options);
            }
        }
    }
    logger.info("Loading Methods ...");
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

    var logger = jsless.logger;

    var _jsless = {
        settings: {
            behavior: {
                name: null,
                event: 'click',
                eventSource: 'self',
                requireEnabled: false,
                target: 'self',
                delay: -1,
                cancelDelay: null,
                params: [],
                dynamic: [],
                stopEventPropagation: false
            }
        },
        behaviors: {
            base: function ($widget, $element, settings, onEvent) {
                var $eventSource = jsless.getSelector(settings.eventSource, $widget, $element).getVal();

                var checkedEvent = function (event, eventData) {
                    if (!settings.requireEnabled || $eventSource.is(":enabled")) {
                        onEvent(event, eventData);
                    }
                }

                if (settings.event == "load") {
                    $widget.one("jsless-widget-complete", function (event, eventData) {                        
                        if (settings.delay >= 0) {
                            setTimeout(function () {
                                checkedEvent(event, eventData);
                            }, settings.delay)
                        } else {
                            checkedEvent(event, eventData);
                        }
                    });
                }
                else {
                    if (settings.delay >= 0) {
                        $eventSource.bind(settings.event, function (event, eventData) {
                            var timer = setTimeout(function () {
                                checkedEvent(event, eventData);
                            }, settings.delay);
                            if (settings.delay > 0 && settings.cancelDelay) {
                                $eventSource.one(settings.cancelDelay, function () {
                                    clearTimeout(timer);
                                });
                            }
                        });
                    }
                    else {
                        $eventSource.bind(settings.event, checkedEvent);
                    }
                }
            },
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
                            var val = jsless.getParams(dynamicParams[indx], $widget, $element);
                            if (typeof val === "object") {
                                //params[indx] = params[indx] || {};
                                $.extend(true, params, val);
                            }
                            else {
                                params[indx] = val;
                            }
                        });


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
                            if (val instanceof Function) {
                                params[indx] = val();
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
                };
                jsless.behaviors.base($widget, $element, settings, onEvent);
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
                var targetSelector = jsless.getSelector(settings.target, $widget, $element);
                var onEvent = function (event, eventData) {
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
                }
                jsless.behaviors.base($widget, $element, settings, onEvent);
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
                var targetSelector = jsless.getSelector(settings.target, $widget, $element);
                var onEvent = function (event, eventData) {
                    logger.debug(settings.name + " event:" + settings.event + "\r\n\t :: " + JSON.stringify(settings));
                    var request = $element.triggerHandler("jsless-" + settings.name + "-begin"); // allow for intercept and termination
                    if (request === undefined || request) {
                        var $target = targetSelector.getVal();//THIS IS THE TARGET COLLECTION OF CHILDREN, I.E. <li>'s
                        var $source = $(event.target).parents(settings.target).addBack(settings.target).first();
                        var className = settings.className;

                        $target.removeClass(className);
                        $source.addClass(className);
                    }
                }
                jsless.behaviors.base($widget, $element, settings, onEvent);
            },
            parentTrigger: function ($widget, $element, behavior, options) {
                var settings = $.extend(true, {}, jsless.settings.behavior, options.method, {
                    name: 'parentTrigger',
                    eventSource: 'widget',
                    parentSelector: '[data-jsless-widget]',
                    parentEvent: 'jsless-reload',
                    level: 1
                }, behavior);

                var onEvent = function (event, eventData) {
                    var $parent = $(event.target);
                    if (settings.level > 0) {
                        $parent = $($parent.parents(settings.parentSelector)[settings.level - 1]);
                    }
                    $parent.triggerHandler(settings.parentEvent, eventData);
                }
                jsless.behaviors.base($widget, $element, settings, onEvent);
            }
        }
    }

    logger.info("Loading Behaviors ...");
    window.jsless = $.extend(true, _jsless, window.jsless || {}); //extend allowing overrides;
}(window.jQuery);



