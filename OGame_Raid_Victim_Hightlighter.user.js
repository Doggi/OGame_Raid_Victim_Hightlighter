// ==UserScript==
// @name        OGame Raid Victim Hightlighter
// @namespace   de.grzanna-online.ogame
// @include     http*://*.ogame.gameforge.com/game/index.php?page=galaxy*
// @version     1.07
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
var maxRange = 120;
var maxSleep = 1500;
var minSleep = 1000;
var toRight = +1;
var toLeft = -1;
var direction = toLeft;
var scriptStarted = false;
var timeout = null;
var block = false;

function loadSettings(){
    var _scriptStarted = Boolean(sessionStorage.getItem("oagme_raid_victim_hightlighter_started"));
    scriptStarted = _scriptStarted || scriptStarted;

    var _maxRank = Number(localStorage.getItem("oagme_raid_victim_hightlighter_max_rank"));
    maxRank = _maxRank || maxRank;

    var _maxRange = Number(localStorage.getItem("oagme_raid_victim_hightlighter_max_range"));
    maxRange = _maxRange || maxRange;

    var _maxSleep = Number(localStorage.getItem("oagme_raid_victim_hightlighter_max_sleep"));
    maxSleep = _maxSleep || maxSleep;

    var _minSleep = Number(localStorage.getItem("oagme_raid_victim_hightlighter_min_sleep"));
    minSleep = _minSleep || minSleep;

    console.log("config", {
        scriptStarted: scriptStarted,
        maxRank: maxRank,
        maxRange: maxRange,
        maxSleep: maxSleep,
        minSleep: minSleep
    });
}

loadSettings();



function addStartStopButton(){
    console.log("add start buttom");
    var buttomText = ( scriptStarted ? "stop" : "start" );
    $("div#galaxyHeader form").append('<div id="" class="btn_blue float_right"> < </div>');
    $("div#galaxyHeader form").append('<div id="ogame_raid_victim_hightlighter_start_stop_buttom" class="btn_blue float_right">' + buttomText + ' Scanner</div>');
    $("div#galaxyHeader form").append('<div id="" class="btn_blue float_right"> > </div>');
    $("div#ogame_raid_victim_hightlighter_start_stop_buttom").click(function(){
        scriptStarted = !scriptStarted;
        buttomText = ( scriptStarted ? "stop" : "start" );
        $(this).html(buttomText + ' Scanner');
        if( scriptStarted ){
            auto();
        } else {
            if( timeout !== null ){
                clearTimeout(timeout);
            }
        }
    });
}
/**
 *
 * @returns {number}
 */
function getFreeSlots(){
    var slotsTotal = Number($("span#slotValue").html().match(/\/\d+/i)[0].replace("/", ""));
    var slotsUsed = Number($("span#slotUsed").html());
    console.log("find total slots: " + slotsTotal);
    console.log("find used slots: " + slotsUsed);
    var slotsFree = slotsTotal - slotsUsed;
    console.log("find free slots: " + slotsFree);
    return slotsFree;
}
/**
 *
 */
function gotoSunsystem(system){
    var input = $("div#galaxyHeader form input#system_input");
    input.val(system);
    timeout = setTimeout(function(){
        $("div#galaxyHeader form div[onclick='submitForm();']").click();
    }, getRandomArbitrary(minSleep, maxSleep));
}

function getSunsystem(){
    var input = $("div#galaxyHeader form input#system_input");
    return input.val();
}
/**
 *
 * @returns {Array}
 */
function getStartPosition(){
    var mond = $("span.planet-koords.moon_active");
    var planet = $("a.planetlink.active span.planet-koords");
    var active = null;
    if( planet.length == 1 ){
        active = planet;
    } else if( mond.length == 1 ){
        active = mond;
    }
    var coordinaten = active.html().match(/\[\d+:\d+:\d+\]/i)[0].replace("[", "").replace("]", "").split(":");
    return coordinaten;
}

function getRandomArbitrary(min, max) {
    var rand = Math.random() * (max - min) + min;
    console.log("Random: " + rand);
    return rand;
}

function scan(victims){
    var victim = victims.pop();
    console.log(victims.length);
    console.log(victim);
    $(victim).css("background-color", "blue");
    $(victim).find("td.action span a.espionage").click();
    $("td#fleetstatusrow div").waitUntilExists(function(){
            if( victims.length > 0 ){
                console.log("scan next");
                timeout = setTimeout(function(){scan(victims)}, getRandomArbitrary(minSleep, maxSleep));
            } else {
                console.log("scan sunsystem");
                timeout = setTimeout(function(){nextSunsystem()}, getRandomArbitrary(minSleep, maxSleep));
            }
    });
}

function nextSunsystem(){
    var home = getStartPosition();
    var actual = getSunsystem();
    if( Math.abs(home[1]-actual) < maxRange ){
        var next = Number(actual) + direction;
        gotoSunsystem(next);
        return true;
    }
    return false;
}

function findVictims(){
    var inactive = $(baseSelector+".longinactive, "+ baseSelector+".inactive").not(".vacation").parent();
    var victims = $.map(inactive, function(item){
        return $(item).find("td.spacer03 a span").html() < maxRank ? item : null;
    });
    return victims;
}

function auto() {
    var _victims = findVictims();

    timeout = setTimeout(function () {
        if( _victims.length > 0 ){
            // Opfer vorhanden
            if( getFreeSlots() >= _victims.length ){
                // genügend freie slots zum scannen
                scan(_victims);
            } else {
                // wenn nicht genügend freie slots frei sind sonnensystem nach x Sekunden neu laden
                timeout = setTimeout(function(){
                    gotoSunsystem(getSunsystem());
                }, getRandomArbitrary(minSleep, maxSleep));
            }
        } else {
            nextSunsystem();
        }
    }, getRandomArbitrary(minSleep, maxSleep));
}

(function () {
    var $ = window.jQuery;
    try {
        $ = unsafeWindow.jQuery;
    } catch (e) {
        console.error("no jquery detected");
    }

    //alles was nach dem laden passieren soll
    $("div#galaxyContent").waitUntilExists(function () {
        addStartStopButton();
        $("table#galaxytable").waitUntilExists(function(){
            if (block) {
                return;
            }
            block = true;
            var inactive = findVictims();

            $.each(inactive, function(index, value){
                $(value).css("background-color","green");
            });

            if( scriptStarted ) {
                console.log("script ist gestartet");
                auto();
            }
        });
    });

    $("#galaxyLoading[style='display: none;']").waitUntilExists(function(){
        console.log("loading weg");
    });

})();