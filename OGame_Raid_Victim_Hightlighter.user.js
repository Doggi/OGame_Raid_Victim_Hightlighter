// ==UserScript==
// @name        OGame Raid Victim Hightlighter
// @namespace   de.grzanna-online.ogame
// @include     http*://*.ogame.gameforge.com/game/index.php?page=galaxy*
// @version     1.01
// @grant       none
// ==/UserScript==

// Wait for a element
(function ($) {

    /**
     * @function
     * @property {object} jQuery plugin which runs handler function once specified element is inserted into the DOM
     * @param {function} handler A function to execute at the time when the element is inserted
     * @param {bool} shouldRunHandlerOnce Optional: if true, handler is unbound after its first invocation
     * @example $(selector).waitUntilExists(function);
     */

    $.fn.waitUntilExists = function (handler, shouldRunHandlerOnce, isChild) {
        var found = 'found';
        var $this = $(this.selector);
        var $elements = $this.not(function () {
            return $(this).data(found);
        }).each(handler).data(found, true);

        if (!isChild) {
            (window.waitUntilExists_Intervals = window.waitUntilExists_Intervals || {})[this.selector] =
                window.setInterval(function () {
                    $this.waitUntilExists(handler, shouldRunHandlerOnce, true);
                }, 500);
        }
        else if (shouldRunHandlerOnce && $elements.length) {
            window.clearInterval(window.waitUntilExists_Intervals[this.selector]);
        }

        return $this;
    }

}(jQuery));

// Script //
var baseSelector = "table#galaxytable tbody tr.row td.playername";
var maxRank = 1400;

(function () {
    var $ = window.jQuery;
    try {
        $ = unsafeWindow.jQuery;
    } catch (e) {
        console.error("no jquery detected");
    }

    //alles was nach dem laden passieren soll
    $("div#galaxyContent").waitUntilExists(function () {
        $("table#galaxytable").waitUntilExists(function(){
            var victims = $(baseSelector+".longinactive, "+ baseSelector+".inactive").not(".vacation").parent();
            victims.each(function(index){
                var rank = $(this).find("td.spacer03 a span").html();
                if( rank < maxRank ){
                    $(this).css("background-color","green");
                    var spioLink = $(this).find("td.action span a.espionage");
                    spioLink.css("background-color","red");
                }
            });
        });
    });

})();