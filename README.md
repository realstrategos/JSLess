JSLess
======
What is JSLess?
---------------
JSLess is a framework that allows you, in a clean and extensible way, to use complex JavaScript/jQuery behaviors without ever having to write or understand JavaScript code.

The primary objective of JSLess is to make developing the user interface easy in a team environment with a programmer and designer. 
For example, a designer with limited/no JavaScript knowledge can easily implement these behaviors within HTML pages and the JavaScript developer can create custom behaviors for that designer to use. 

Let the designers focus on designing and let the programmers focus on programming! 

Getting Started
---------------
* [Download the latest release](https://github.com/realstrategos/JSLess/archive/master.zip).
* Clone the repo: `git clone https://github.com/realstrategoes/JSLess.git`.
* Install with [Bower](http://bower.io): `bower install jsless`.
* Download the [NuGet Package](http://www.nuget.org/packages/JSLess/)

Add this at the bottom of your page, before the ending `body` tag.
```html
<script type="text/javascript">//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js</script>
<script type="text/javascript">js/jsless.min.js</script>
<script type="text/javascript">
  $(document).ready(function () {
    $("body").jsless({});
  });
</script>
```
Also, give your containing DIV a <b>widget ID</b>, preferably a unique ID such as `Guid.NewGuid()`. For example, `<div data-jsless-widget="myWidget">`. This is defines the scope when submitting forms as well as other actions by JSLess.

Features
----------------------
####Behaviors/Methods
Behaviors are complex (or simple) actions that change the HTML DOM in some manner.

Execute `name = "execute"` is a behavior that executes a function with the specified parameters. Essentially, you can put any
jQuery method or function (i.e. .hide(), .show(), .animate()) inside `method = ""`. Third-party plugins also work. For example, Bootstrap 
has a [Tooltip plugin](http://getbootstrap.com/javascript/#tooltips) that can be called with JSLess by setting `method = "tooltip"`

####Defaults for Execute
<ul>
  <li>name = "execute"</li>
  <li>method = null</li>
  <li>event = "click"</li>
  <li>eventSource = <b>selector</b></li>
  <li>target = <b>selector</b></li>
  <li>params = []</li>
  <li>delay = -1</li>
  <li>object = jQuery</li>
</ul>

####JSLess Custom Functions
A third file is included when downloading the JSLess library, <b>jsless.example.js</b>. This contains a few "stock" custom behaviors and allows you to add more to it. 
When placing this file in your directory, change the name of the file to a custom name (jsless.yourSite.js) so you can customize it.

JSLess custom can be used for many reasons...
* To create custom behaviors that cannot be achieved with Execute
* For use with behaviors that are used many times in your application
* Or use it however you want!
 
A few basic example are included by default in the jsless.example file. 
* .show() 
* .hide() 
* plus1 (a function which adds 1 to a target) 
* htmlnext (useful for single page apps - further explaination to come)

(We hope to have a place for people to post their custom behaviors <em>soon</em>.)


Examples
----------------------

<b>NOTE:</b> The example below are using ASP.NET, therefore JSLess statements in your markup can be rendered correctly. Otherwise, a JSLess statement would be a raw JSON statement, which needs converted (somehow, still working on this).

###Execute

<b>Execute | .toggle()</b>
```
<button type="button" 
  data-jsless="@(new object[] { new { name = "execute", method = "toggle", target = ".create-discussion" } }.ToJsonObject())">
toggle btn </button>
```

Optionally, if you want to animate your method/function and you're using jQuery UI, you can add `@params = new object[] { "linear" }` after `target`, which specifiies the easing animation to apply. In this case <em>linear</em> is the effect.

<b>Execute | .animate()</b>
```
<span 
  data-jsless="@(new object[] { new { name = "execute", method = "animate", @event = "load", target = new { target = "html,body", scope = "document" }, @params = new object[] { new { scrollTop = "0" } } } }.ToJsonObject())">
</span>
```

<b>Execute | Bootstrap Tooltip</b>
```
<div 
  data-jsless="@(new object[] { new { name = "execute", @event = "load", method = "tooltip", target = ".myTooltipClass" } }.ToJsonObject())">
</div>
```
(<em><b>Notice:</b></em> the `@event = "load"`, which will execute the method when the page loads. Similar to `document.ready()` in jQuery)

###Custom Behaviors

<b>Custom Functions (jsless.example.js) | show, hide, etc. </b>
<b>.show()</b>
```
<button type="button"
   data-jsless="@(new object[] { new { name = "show", target = ".hiddenDiv" } }.ToJsonObject())">
   show the div!
</button>
```
<b>.show() & .hide()</b>
```
<button type="button"
   data-jsless="@(new object[] { new { name = "show", target = ".hiddenDiv" },
   data-jsless="@(new object[] { new { name = "hide", target = ".visibleDiv" } }.ToJsonObject())">
   show this hide that!
</button>
```

