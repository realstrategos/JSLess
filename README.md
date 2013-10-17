JSLess
======
What is JSLess?
---------------
JSLess is a framework that allows you, in a clean and extensible way, to use complex JavaScript/jQuery behaviors without ever having to write or understand JavaScript code.

Getting Started
---------------
* [Download the latest release]().
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
Also, give your containing DIV a <b>widget ID</b>. For example, `<div data-jsless-widget="myWidget">`. This is targeted when submitting forms as well as other actions by JSLess.

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


Examples
----------------------
<b>Execute | .toggle()</b>
```
<button type="button" 
  data-jsless="@(new object[] { new { name = "execute", method = "toggle", target = ".create-discussion" } }.ToJsonObject())">
toggle btn </button>
```

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
