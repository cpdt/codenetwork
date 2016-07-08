var $ = require('jquery');
var $header = $('.header-background, .header-container');

var headerHeight = 74;

if ($header.length) {
    var $stickyHeader = $('.sticky-header');
    var $cover = $('.header-cover');
    var coverHeight = $cover.outerHeight();

    function update() {
        var scrollAmount = $(window).scrollTop();
        var scrollPercent = scrollAmount / (coverHeight - headerHeight);
        var marginHeight = Math.min(headerHeight, headerHeight * scrollPercent);
        $header.css('top', -marginHeight);
        $cover.css('opacity', Math.min(1, 0.8 * scrollPercent));


        $header.css('bottom', marginHeight);
        $cover.css('bottom', marginHeight);

        if (marginHeight < headerHeight) {
            var stickyHeaderPos = coverHeight - marginHeight;
            $stickyHeader.css({
                position: 'absolute',
                top: stickyHeaderPos,
                height: marginHeight
            });
        } else {
            $stickyHeader.css({
                position: 'fixed',
                top: 0,
                height: ''
            });
        }
    }

    $(window).scroll(update);
    update();
}