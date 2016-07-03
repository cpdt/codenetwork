module.exports = function(grunt) {
    grunt.initConfig({
        clean: {
            img: ['public/img/'],
            font: ['public/fonts'],
            js: ['public/bundle.js'],
            css: ['public/bundle.css'],
            html: ['public/**/*.html']
        },
        copy: {
            img: { expand: true, cwd: 'src/img/', src: ['*'], dest: 'public/img/' },
            font: { expand: true, cwd: 'src/fonts/', src: ['*'], dest: 'public/fonts/' },
            html: { expand: true, cwd: 'src/', src: ['**/*.html'], dest: 'public/' }
        },
        browserify: {
            dev: {
                src: 'src/js/index.js',
                dest: 'public/bundle.js'
            }
        },
        less: {
            dev: {
                src: 'src/less/index.less',
                dest: 'public/bundle.css'
            }
        }
    });

    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-browserify');
    grunt.loadNpmTasks('grunt-contrib-less');

    grunt.registerTask('update-img', ['clean:img', 'copy:img']);
    grunt.registerTask('update-font', ['clean:font', 'copy:font']);
    grunt.registerTask('update-js', ['clean:js', 'browserify:dev']);
    grunt.registerTask('update-css', ['clean:css', 'less:dev']);
    grunt.registerTask('update-html', ['clean:html', 'copy:html']);
    grunt.registerTask('default', ['update-img', 'update-font', 'update-js', 'update-css', 'update-html']);
};