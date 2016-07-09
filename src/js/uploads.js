/*var $ = require('jquery');
var Dropzone = require('dropzone');

Dropzone.autoDiscover = false;

$('.img-upload').each(function() {
    var $upload = $(this);
    $upload.addClass('dropzone');
    var $form = $upload.parents('form');
    $upload.dropzone({
        url: $form.attr('action'),
        paramName: $upload.attr('name'),
        maxFiles: 1,
        acceptedFiles: 'image/*'
    });
});*/

var $ = require('jquery');
var loadImage = require('blueimp-load-image');

function updateImg(input, $input, initial) {
    var file = false;
    if (input.files && input.files[0]) file = input.files[0];
    else if (initial) file = $input.data('initial');

    if (file) {
        $input.siblings('.error-box').remove();
        var $preview = $input.siblings('.preview').empty();

        loadImage(
            file,
            function(img) {
                if (img.type === 'error') {
                    $input.after('<div class="box error-box"><p>Please upload an image.</p></div>');
                }
                else $preview.append(img);
            },
            {
                maxWidth: 435,
                maxHeight: 200,
                cover: true,
                crop: true
            }
        )
    }
}

$('input[type=file]').each(function() {
    var $input = $(this);
    updateImg(this, $input, true);
    $input.change(function() {
        updateImg(this, $input);
    });
});