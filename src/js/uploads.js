var $ = require('jquery');
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
});