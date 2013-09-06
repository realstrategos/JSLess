show
=======
blah blah

show: function ($widget, $element, behavior, options) {
    var settings = $.extend(true, {
            name: 'show',
            object: "jQuery",
            method: 'show',
            params: ["300"]
            }, jsless.settings.behavior, options.behavior, behavior);

            //shortcut for execute
            jsless.behaviors.execute($widget, $element, settings, options);
} 
