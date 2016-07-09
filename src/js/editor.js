var $ = require('jquery');
var ace = require('brace');
require('brace/mode/markdown');
require('brace/mode/plain_text');
require('brace/theme/tomorrow');

$('.editor').each(function() {
    var $editor = $(this);
    var mode = $editor.data('mode');

    var editor = ace.edit(this);
    var session = editor.getSession();
    editor.setTheme('ace/theme/tomorrow');
    editor.setOptions({
        maxLines: 30
    });
    session.setMode('ace/mode/' + mode);
    session.setUseWrapMode(true);
    session.setWrapLimitRange();
});

$('.has-editors').submit(function(e) {
    console.log('submit!');

    var $editors = $(this).find('.editor');
    $editors.each(function() {
        /*var $editor = $(this);
        var $textareas = $editor.siblings('textarea');
        var editor = editors[$editor.data('editor-id')];
        $textareas.val(editor.getSession().getValue());

        console.log('setting', $textareas, 'for', $editor);*/

        var $editor = $(this);
        var $textareas = $editor.siblings('textarea');
        var editor = ace.edit(this);
        $textareas.val(editor.getSession().getValue());
    });
});