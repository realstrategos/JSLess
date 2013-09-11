/*!
 * JSLess Library - AJAX Invoke
 * https://github.com/realstrategos/JSLess
 * *
 * Copyright 2013 OptixConnect LLC and other contributors
 * Released under the MIT license
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

