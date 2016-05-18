module.exports = function (grunt) {
	'use strict';
	
	var fullYear = new Date().getFullYear();
	
	// Time how long tasks take. Can help when optimizing build times
	require('time-grunt')(grunt);
	
	// Load grunt tasks automatically
	require('load-grunt-tasks')(grunt);
	
	// Configurable vars
	var config = {
		src: 'src',
		dist: 'dist',
		example: 'example',
		banner: '/*!\n * backbone.maps\n * A Backbone JS extension for interacting with javascript maps APIs\n * Copyright (c) 2015' + (fullYear != 2015 ? '-' + fullYear : '') + ' Radoslav Salov\n * Distributed under MIT license\n * Copyright for portions of the project are held by:\n * Edan Schwartz (c) 2012-2015 ( https://github.com/eschwartz/backbone.googlemaps )\n */\n',
		jshintFiles: ['Gruntfile.js', '<%= config.src %>/*.js', '<%= config.example %>/js/**/*.js'],
		uglifyFiles: {
			'<%= config.dist %>/backbone.maps.google.min.js': [ '<%= config.src %>/backbone.maps.google.js' ],
			'<%= config.dist %>/backbone.maps.leaflet.min.js': [ '<%= config.src %>/backbone.maps.leaflet.js' ]
		}
	};
	
	// Define the configuration for all the tasks
	grunt.initConfig({
		// Get package meta data
		pkg: grunt.file.readJSON('package.json'),
		
		// Project settings
		config: config,
		
		// Tasks
		watch: {
			scripts: {
				files: config.jshintFiles,
				tasks: ['jshint']
			}
		},
		
		jshint: {
			options: {
				jshintrc: true
			},
			files: config.jshintFiles
		},
		
		uglify: {
			dist: {
				options: {
					compress: {
						drop_console: true
					},
					banner: '<%= config.banner %>',
					mangle: {
						except: ["$super", 'require']
					},
					preserveComments: false
				},
				files: config.uglifyFiles
			}
		}
		
	});
	
	grunt.registerTask('default', [
		'jshint',
		'uglify:dist'
	]);
	  
};
