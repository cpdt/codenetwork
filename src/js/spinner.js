var $ = require('jquery');

var runningInterval = false;
var updateTime = 2000;

var $spanChildren = $('.spinner-inner span');
var spanHeights = $spanChildren.height();

var $spinner = $(".spinner");
$spinner.height(spanHeights);

var $spinnerInners = $(".spinner-inner");

function update() {
    console.log('updating');
    $spinnerInners.each(function() {
        var $spinnerInner = $(this);
        var currentTop = parseFloat($spinnerInner.css('top'));
        var newTop = currentTop - spanHeights;

        if (-newTop >= $spinnerInner.height()) {
            $spinnerInner.css({
                transition: 'none',
                top: 0
            });
            setTimeout(function() {
                $spinnerInner.css({
                    transition: '',
                    top: -spanHeights
                });
            }, 0);
        } else $spinnerInner.css('top', newTop);

        //$spinnerInner.css('top', parseFloat($spinnerInner.css('top')) - spanHeights);
    });
}

exports.start = function() {
    if (runningInterval !== false) return;

    runningInterval = setInterval(update, updateTime);
};