/// <binding BeforeBuild='debug' />
/* global module:false */

module.exports = function (grunt) {

    // function used by uglify to keep vscode comments (///) tripple
    // slashes which are used by jaydata odata service function
    // annotations
    function keepVsCodeComments(node, ast_node) {
        return (ast_node && ast_node.value && ast_node.value[0] === '/');
    }


    // Project configuration
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),

        // see https://github.com/gruntjs/grunt-contrib-clean
        clean: {
            debug: [ 'dist' ],
            release: [ 'dist' ]
        },
        
        // see https://github.com/gruntjs/grunt-contrib-uglify
        uglify: {
            server_debug: {
                options: {
                    banner: '/*! <%= pkg.name %>(v<%= pkg.version %>, <%= grunt.template.today("yyyy-mm-dd") %>) ' +
                        '- <%= pkg.license %> - copyright <%= pkg.author %> */\n',
                    mangle: false,
                    compress: false,
                    sourceMap: false,
                    report: 'min',
                    beautify: true,
                    preserveComments: keepVsCodeComments
                },
                files: [
                    {expand: true, cwd: 'source/server', src: '**/*.js', dest: 'dist'}
                ]
            },
            server_release: {
                options: {
                    banner: '/*! <%= pkg.name %>(v<%= pkg.version %>, <%= grunt.template.today("yyyy-mm-dd") %>) ' +
                        '- <%= pkg.license %> - copyright <%= pkg.author %> */\n',
                    mangle: {
                        except: [
                        ],
                    },
                    sourceMap: false,
                    //sourceMapName: 'path/to/sourcemap.map'
                    report: 'min',
                    beautify: false,
                    preserveComments: keepVsCodeComments
                },
                files: [
                    {expand: true, cwd: 'source/server', src: '**/*.js', dest: 'dist'}
                ]
            },
        },
        // see https://github.com/gruntjs/grunt-contrib-htmlmin
        htmlmin: {
            client_debug: {
                options: {
                    removeComments: false,
                    collapseWhitespace: false,
                    removeOptionalTags: false
                },
                files: {
                    // pages
                    'dist/docs/index.html': 'source/client/index.html',
                    'dist/docs/main.html': 'source/client/main.html',
                    'dist/docs/test.html': 'source/client/test.html'
                }
            },
            client_release: {
                options: {
                    removeComments: true,
                    collapseWhitespace: true,
                    removeOptionalTags: true
                },
                files: {
                    // pages
                    'dist/docs/index.html': 'source/client/index.html',
                    'dist/docs/main.html': 'source/client/main.html',
                    'dist/docs/test.html': 'source/client/test.html'
                }
            }
        },

        // see https://github.com/gruntjs/grunt-contrib-cssmin
        cssmin: {
            client_debug: {
                files: {
                    'dist/docs/assets/css/main.css': [
                        'source/client/assets/css/main.css'
                    ]
                }
            },
            client_release: {
                files: {
                    'dist/docs/assets/css/main.css': [
                        'source/client/assets/css/main.css'
                    ]
                }
            }
        },
        
		// see https://github.com/gruntjs/grunt-contrib-copy
		copy: {
            server_debug: {
                files: [
                    { src: [ 'package.json' ], dest: 'dist/package.json' },
                    { src: [ 'readme.md' ], dest: 'dist/readme.md' },
                    { src: [ 'source/server/favicon.ico' ], dest: 'dist/favicon.ico' },
                    { expand: true, flatten: true, src: [ 'source/server/testdata/*' ], dest: 'dist/testdata/' },
                    { expand: true, flatten: true, src: [ 'source/server/lib/schemas/*' ], dest: 'dist/lib/schemas/' }
                ]
            },
            server_release: {
                files: [
                    { src: [ 'package.json' ], dest: 'dist/package.json' },
                    { src: [ 'readme.md' ], dest: 'dist/readme.md' },
                    { src: [ 'source/server/favicon.ico' ], dest: 'dist/favicon.ico' },
                    { expand: true, flatten: true, src: [ 'source/server/testdata/*' ], dest: 'dist/testdata/' },
                    { expand: true, flatten: true, src: [ 'source/server/lib/schemas/*' ], dest: 'dist/lib/schemas/' }
                ]
            },
            client_debug: {
                files: [
                    // legacy
                    {expand: true, flatten: true,
                    src: [ 'source/client/assets/js/nl.*' ], 
                    dest: 'dist/docs/assets/js/'},
                    {src: [ 'source/client/assets/js/lib/jquery.dataTables.odata.js' ], 
                    dest: 'dist/docs/assets/js/lib/jquery/jquery.dataTables.odata.js'},
                    {src: [ 'source/client/assets/js/lib/odata.entities.js' ], 
                    dest: 'dist/docs/assets/js/odata.entities.js'},
                    
                    
                    // service templates
                    {expand: true, flatten: true,
                    src: [ 'source/client/templates/*.txt' ], 
                    dest: 'dist/docs/templates/'},

                    // jQuery
                    // js
                    {expand: true, flatten: true,
                    src: [ 'bower_components/jquery/dist/jquery.js' ], 
                    dest: 'dist/docs/assets/js/lib/jquery/'},

                    // bootstrap
                    // js
                    {src: [ 'bower_components/bootstrap/dist/js/bootstrap.js' ], 
                    dest: 'dist/docs/assets/js/lib/bootstrap/bootstrap.js'},
                    {src: [ 'bower_components/bootstrap-combobox/js/bootstrap-combobox.js' ], 
                    dest: 'dist/docs/assets/js/lib/bootstrap/bootstrap.combobox.js'},
                    // css
                    {src: [ 'bower_components/bootstrap/dist/css/bootstrap.css' ], 
                    dest: 'dist/docs/assets/js/lib/bootstrap/css/bootstrap.css'},
                    {src: [ 'bower_components/bootstrap/dist/css/bootstrap-theme.css' ], 
                    dest: 'dist/docs/assets/js/lib/bootstrap/css/bootstrap.theme.css'},
                    {src: [ 'bower_components/bootstrap-combobox/css/bootstrap-combobox.css' ], 
                    dest: 'dist/docs/assets/js/lib/bootstrap/css/bootstrap.combobox.css'},
                    // fonts
                    {expand: true, flatten: true,
                    src: [ 'bower_components/bootstrap/dist/fonts/*' ], 
                    dest: 'dist/docs/assets/js/lib/bootstrap/fonts/'},
                    
                    // leaflet
                    // js
                    {src: [ 'bower_components/leaflet/dist/leaflet-src.js' ], 
                    dest: 'dist/docs/assets/js/lib/leaflet/leaflet.js'},
                    {src: [ 'source/client/assets/js/lib/leaflet/leaflet-bing.js' ], 
                    dest: 'dist/docs/assets/js/lib/leaflet/leaflet-bing.js'},
                    {src: [ 'source/client/assets/js/lib/leaflet/leaflet-google.js' ], 
                    dest: 'dist/docs/assets/js/lib/leaflet/leaflet-google.js'},
                    // css
                    {expand: true, flatten: true,
                    src: [ 'bower_components/leaflet/dist/leaflet.css' ], 
                    dest: 'dist/docs/assets/js/lib/leaflet/css/'},
                    // images
                    {expand: true, flatten: true,
                    src: [ 'bower_components/leaflet/dist/images/*' ], 
                    dest: 'dist/docs/assets/js/lib/leaflet/images/'},

                    // codemirror
                    // js
                    {src: [ 'bower_components/codemirror/lib/codemirror.js' ], 
                    dest: 'dist/docs/assets/js/lib/codemirror/codemirror.js'},
                    {src: [ 'bower_components/codemirror/mode/xml/xml.js' ], 
                    dest: 'dist/docs/assets/js/lib/codemirror/xml.js'},
                    {src: [ 'bower_components/codemirror/mode/javascript/javascript.js' ], 
                    dest: 'dist/docs/assets/js/lib/codemirror/javascript.js'},
                    {src: [ 'bower_components/codemirror/addon/search/search.js' ], 
                    dest: 'dist/docs/assets/js/lib/codemirror/search.js'},
                    {src: [ 'bower_components/codemirror/addon/search/searchcursor.js' ], 
                    dest: 'dist/docs/assets/js/lib/codemirror/searchcursor.js'},
                    {src: [ 'source/client/assets/js/lib/codemirror/searchwithoutdialog.js' ], 
                    dest: 'dist/docs/assets/js/lib/codemirror/searchwithoutdialog.js'},
                    {src: [ 'bower_components/codemirror/addon/dialog/dialog.js' ], 
                    dest: 'dist/docs/assets/js/lib/codemirror/dialog.js'},
                    // css
                    {src: [ 'bower_components/codemirror/lib/codemirror.css' ], 
                    dest: 'dist/docs/assets/js/lib/codemirror/css/codemirror.css'},
                    {src: [ 'bower_components/codemirror/addon/dialog/dialog.css' ], 
                    dest: 'dist/docs/assets/js/lib/codemirror/css/dialog.css'},

                    {expand: true, flatten: true, src: ['source/client/assets/fonts/*'], 
                    dest: 'dist/docs/assets/fonts/'},
                    {expand: true, flatten: true, src: ['source/client/assets/ico/*'], 
                    dest: 'dist/docs/assets/ico/'},
                    {expand: true, flatten: true, src: ['source/client/assets/images/*'], 
                    dest: 'dist/docs/assets/images/'}
                ]
            },
            client_release: {
                files: [
                    // legacy
                    {expand: true, flatten: true,
                    src: [ 'source/client/assets/js/nl.*' ], 
                    dest: 'dist/docs/assets/js/'},
                    {src: [ 'source/client/assets/js/lib/jquery.dataTables.odata.js' ], 
                    dest: 'dist/docs/assets/js/lib/jquery/jquery.dataTables.odata.js'},
                    {src: [ 'source/client/assets/js/lib/odata.entities.js' ], 
                    dest: 'dist/docs/assets/js/odata.entities.js'},
                    
                    
                    // service templates
                    {expand: true, flatten: true,
                    src: [ 'source/client/templates/*.txt' ], 
                    dest: 'dist/docs/templates/'},

                    // jQuery
                    // js
                    {src: [ 'bower_components/jquery/dist/jquery.min.js' ], 
                    dest: 'dist/docs/assets/js/lib/jquery/jquery.js'},
                    
                    // bootstrap
                    // js
                    {src: [ 'bower_components/bootstrap/dist/js/bootstrap.min.js' ], 
                    dest: 'dist/docs/assets/js/lib/bootstrap/bootstrap.js'},
                    {src: [ 'bower_components/bootstrap-combobox/js/bootstrap-combobox.js' ], 
                    dest: 'dist/docs/assets/js/lib/bootstrap/bootstrap.combobox.js'},
                    // css
                    {src: ['bower_components/bootstrap/dist/css/bootstrap.min.css'], 
                    dest: 'dist/docs/assets/js/lib/bootstrap/css/bootstrap.css'},
                    {src: ['bower_components/bootstrap/dist/css/bootstrap-theme.min.css'], 
                    dest: 'dist/docs/assets/js/lib/bootstrap/css/bootstrap.theme.css'},
                    {src: [ 'bower_components/bootstrap-combobox/css/bootstrap-combobox.css' ], 
                    dest: 'dist/docs/assets/js/lib/bootstrap/css/bootstrap.combobox.css'},
                    // fonts
                    {expand: true, flatten: true,
                    src: [ 'bower_components/bootstrap/dist/fonts/*' ], 
                    dest: 'dist/docs/assets/js/lib/bootstrap/fonts/'},
                    
                    // leaflet
                    // js
                    {src: [ 'bower_components/leaflet/dist/leaflet.js' ], 
                    dest: 'dist/docs/assets/js/lib/leaflet/leaflet.js'},
                    {src: [ 'source/client/assets/js/lib/leaflet/leaflet-bing.js' ], 
                    dest: 'dist/docs/assets/js/lib/leaflet/leaflet-bing.js'},
                    {src: [ 'source/client/assets/js/lib/leaflet/leaflet-google.js' ], 
                    dest: 'dist/docs/assets/js/lib/leaflet/leaflet-google.js'},
                    // css
                    {expand: true, flatten: true,
                    src: [ 'bower_components/leaflet/dist/leaflet.css' ], 
                    dest: 'dist/docs/assets/js/lib/leaflet/css/'},
                    // images
                    {expand: true, flatten: true,
                    src: [ 'bower_components/leaflet/dist/images/*' ], 
                    dest: 'dist/docs/assets/js/lib/leaflet/images/'},

                    // codemirror
                    // js
                    {src: [ 'bower_components/codemirror/lib/codemirror.js' ], 
                    dest: 'dist/docs/assets/js/lib/codemirror/codemirror.js'},
                    {src: [ 'bower_components/codemirror/mode/xml/xml.js' ], 
                    dest: 'dist/docs/assets/js/lib/codemirror/xml.js'},
                    {src: [ 'bower_components/codemirror/mode/javascript/javascript.js' ], 
                    dest: 'dist/docs/assets/js/lib/codemirror/javascript.js'},
                    {src: [ 'bower_components/codemirror/addon/search/search.js' ], 
                    dest: 'dist/docs/assets/js/lib/codemirror/search.js'},
                    {src: [ 'bower_components/codemirror/addon/search/searchcursor.js' ], 
                    dest: 'dist/docs/assets/js/lib/codemirror/searchcursor.js'},
                    {src: [ 'source/client/assets/js/lib/codemirror/searchwithoutdialog.js' ], 
                    dest: 'dist/docs/assets/js/lib/codemirror/searchwithoutdialog.js'},
                    {src: [ 'bower_components/codemirror/addon/dialog/dialog.js' ], 
                    dest: 'dist/docs/assets/js/lib/codemirror/dialog.js'},
                    // css
                    {src: [ 'bower_components/codemirror/lib/codemirror.css' ], 
                    dest: 'dist/docs/assets/js/lib/codemirror/css/codemirror.css'},
                    {src: [ 'bower_components/codemirror/addon/dialog/dialog.css' ], 
                    dest: 'dist/docs/assets/js/lib/codemirror/css/dialog.css'},

                    {expand: true, flatten: true, src: ['source/client/assets/fonts/*'], 
                    dest: 'dist/docs/assets/fonts/'},
                    {expand: true, flatten: true, src: ['source/client/assets/ico/*'], 
                    dest: 'dist/docs/assets/ico/'},
                    {expand: true, flatten: true, src: ['source/client/assets/images/*'], 
                    dest: 'dist/docs/assets/images/'}
                ]
            }
		},
        
        compress: {
            zip: {
                options: {
                    archive: './lost.zip',
                    mode: 'zip'
                },
                files: [
                    { src: './gpl-3.0.txt' },
                    { src: './start_server.*' },
                    { src: './start_mongo.*' },
                    { src: './dist/**' }
                ]
            }
        }
    });



    // Load Grunt plugins.
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-uglify');
	grunt.loadNpmTasks('grunt-contrib-htmlmin');
	grunt.loadNpmTasks('grunt-contrib-cssmin');
	grunt.loadNpmTasks('grunt-contrib-copy');
	grunt.loadNpmTasks('grunt-contrib-compress');
	grunt.loadNpmTasks('grunt-contrib-concat');
	grunt.loadNpmTasks('grunt-jsdoc');   


    // Tasks
    grunt.registerTask('createDirectories', function (d) {
        grunt.file.mkdir('dist');
        grunt.file.mkdir('dist/docs');
        grunt.file.mkdir('dist/logs');
        grunt.file.mkdir('dist/downloads');
    });



    // tasks / targets
    grunt.registerTask('debug', [
        'clean:debug',
        'createDirectories',
        
        'copy:server_debug',
        'uglify:server_debug',
        
        'copy:client_debug',
        'htmlmin:client_debug',
        'cssmin:client_debug',
        
        'compress:zip'
    ]);
    grunt.registerTask('deploy_debug', [
        'deploy:debug'
    ]);

    grunt.registerTask('release', [
        'clean:release',
        'createDirectories',
        
        'copy:server_release',
        'uglify:server_release',
        
        'copy:client_release',
        'htmlmin:client_release',
        'cssmin:client_release',
        
        'compress:zip'
    ]);
    grunt.registerTask('deploy_release', [
        'deploy:release'
    ]);

    grunt.registerTask('default', ['release']);
    grunt.registerTask('build', ['debug']);
};

