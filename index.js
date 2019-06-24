'use strict';

const path          = require('path');
const PluginError   = require('plugin-error');
const through       = require('through2');
//const HTMLParser  = require('node-html-parser');
const cheerio       = require('cheerio')

//const replace = require('./lib/replace');
const fs        = require('fs');
const postcss   = require('postcss');
const svgo      = require('postcss-svgo');

const opts = {
    	encode: true,
    plugins: [{
        removeDoctype: false
    }, {
        removeComments: true
    }, {
        cleanupNumericValues: {
            floatPrecision: 2
        }
    }, {
        convertColors: {
            names2hex: false,
            rgb2hex: false
        }
    }]
};

module.exports = function (options) {
	let renames = [];
	const cache = [];
	let root = '';
	const classesArr = [];

	options = Object.assign({ searchInExtionsions: ['.tpl', '.html', '.hbs']}, options);

	// console.log(options.selector);

	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			this.push(file);
			return cb();
		}

		if (file.isStream()) {
			this.emit('error', new PluginError('gulp-process-icons', 'Streaming not supported'));
			return cb();
		}


		if (options.searchInExtionsions.includes(path.extname(file.path))) {
			// File should be searched for replaces
			cache.push(file);
		} else {
			// Nothing to do with this file
			this.push(file);
		}

		cb();
	}, function (cb) {
		const stream = this;

		getClasses(options);

		//saveData(classesArr.join(','), './build/styles/test.scss');


		saveData('', options.output);

		for (var i = 0; i < classesArr.length; i++) {

			// Get svg code for the icon
			console.log('classesArr[i]: '+classesArr[i]);
			const iconSvg = getSvg(classesArr[i]);

			if(iconSvg){
				// Process it
				var sassIcon = "."+classesArr[i]+"{\n\r\tbackground-image : url(\"data:image/svg+xml,"+iconSvg.replace(/["]/g,'\'')+"\");\n\r}\n\r";

				postcss([ svgo(opts) ]).process(sassIcon).then(function (result) {
				   //console.log(result);
				   var encodedIcon = result.css;

				   // Append to the sass
				   	appendSvg(encodedIcon, options.output);
				});
			}


		}


		function getClasses(options){

			//console.log(options.selector);
			//console.log(options.selector);

			// Search in the cached
			// files and push them through.
			cache.forEach(file => {

				const contents = file.contents.toString();
				const $     = cheerio.load(contents);

				const elements   = $(options.selector);
				if(elements !== null){

					elements.each(function(i, elem) {
						//console.log($(this).attr('class'));
						// console.log($(this).attr('class'));
						// conver classes into an array
						const classes = $(this).attr('class').split(' ');

						for (var i = 0; i < classes.length; i++) {

					        console.log(classes[i]);

					        if(classesArr.indexOf(classes[i]) === -1 && classes[i] !== 'icon') {
						    	classesArr[classesArr.length] = classes[i];
						    	// console.log(this.items);
						    }
					    }
						// classesArr[i] = $(this).attr('class');
					});
					//

					//element = element.substring(1)
					//const elementArray = JSON.parse(element);
					//console.log(elementArray);

				}

				// console.log(classesArr);


				// console.log(classes);
				//let newContents = replace(contents, modifiedRenames);

				//const regex = /class=\"?(.+)?(icon-[a-Z0-9]*)(.+)\"?/g;
				//const regex = /class=\"?([a-z0-9 -]*)\"?/gi;
				//matches
				//console.log(contents.match(regex));

				// console.log(paragraph[paragraph.search(regex)]);

				//if (options.prefix) {
				//	newContents = newContents.split('/' + options.prefix).join(options.prefix);
				//}
//
				//file.contents = Buffer.from(newContents);
				//stream.push(file);
			});

			cb();
		}

		function saveData(data, filepath){

			fs.writeFile(filepath, data, function(err) {
			    if(err) {
			        return console.log(err);
			    }

			    console.log("The file was saved!");
			});
		}

		function getSvg(filename){

			filename = filename.replace('icon-','');

			var fileContents;
			var brand = false;
			try {
			  fileContents = fs.readFileSync('./node_modules/@fortawesome/fontawesome-pro/svgs/light/'+filename+'.svg', 'utf8', function(err, contents) {});
			} catch (err) {

				// If nothing is found it could be a brand icon
				brand = true;

				// Don't return we need to process the brand
			}

			console.log('class: '+filename);
			console.log('brand: '+brand);

			// Check for brand icon
			if(brand){

				filename = filename.replace('fab-','');

				console.log('brand icon: '+filename);
				//console.log('./node_modules/@fortawesome/fontawesome-pro/svgs/brands/'+filename+'.svg');

				try {
				  fileContents = fs.readFileSync('./node_modules/@fortawesome/fontawesome-pro/svgs/brands/'+filename+'.svg', 'utf8', function(err, contents) {});
				} catch (err) {
					console.log(err);
				  return;
				}
			}

			if(fileContents){
				return fileContents;
			}
			return;

			// return fs.readFileSync('./node_modules/@fortawesome/fontawesome-pro/svgs/light/'+filename+'.svg', 'utf8', function(err, contents) {
			//     //console.log(contents);
			// });
		}

		function appendSvg(data, file){
			// append data to file
			fs.appendFile(file, data, 'utf8',
			    // callback function
			    function(err) {
			        if (err) throw err;
			        // if no error
			        console.log("Data is appended to file successfully.")
			});
		}

	});

};
