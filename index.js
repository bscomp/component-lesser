var async = require('async');
var path = require('path');
var less = require('less');
var fs = require('fs');


function isLess(filename) {
	var ext = path.extname(filename);
	if (ext === '.less') {
		return true;
}
	return false;
}


module.exports = function (builder, options) {
	options = options || {};
  var bindex = 0;
  var lessImport = [];
  builder.on('dependency', depHandler);

  function depHandler(b){
    b.dep = true;
    b.on('dependency', depHandler);
    b.config.styles.forEach(function(file){
      if(isLess(file) && !~lessImport.indexOf(b.path(file))){
        lessImport.push(b.path(file));
      }
    });
  }
  builder.hook('before styles', function (builder, callback) {
    if(!builder.root) {
      builder.config.styles.forEach(function(file){
        builder.removeFile('styles', file);
      });
      return callback();
    }
    builder.config.styles.slice().forEach(function(file){
      if(isLess(file) && !~lessImport.indexOf(builder.path(file))){
        lessImport.push(builder.path(file));
      }
			builder.removeFile('styles', file);
    });
    var importsLess = "";
    lessImport.forEach(function(file){
      importsLess+='@import "'+file +'";\n';
    });
    var parser = new less.Parser(options.env || {});
		var cssConfig = options.cssConfig || {};
    setTimeout(function(){
    parser.parse(importsLess, function (error, tree) {
      if (error) {
				return cb(error);
			}
			var css = tree.toCSS(cssConfig);
      
			builder.addFile('styles', "compiledLess", css);
		  callback()
    });
    },1000);
	});
};

module.exports.ext = ['.less']
