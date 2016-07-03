require('typed.js');
var $ = require('jquery');

var messages = [
    "whatever",
    "robots",
    "open source",
    "beasts",
    "software",
    "AdamBot",
    "Jubb",
    "startups"
];

$('header h2 span').typed({
    strings: messages,
    typeSpeed: 40,
    startDelay: 150,
    backSpeed: 20,
    showCursor: false,
    loop: true
});