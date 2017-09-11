////////////////////////////////////////////////////////////////////////////
///                       Part of org-parser                             ///
////////////////////////////////////////////////////////////////////////////
/// \file common.js
/// \author Jamie Terry
/// \date 2017/09/10
/// \brief Defines functions and utilities common to many of the test files
////////////////////////////////////////////////////////////////////////////

"use strict";

global.expect = require('chai').expect;
global.P = require('../src/ParserUtils.js');

/////////////////////////////////////////////////////////////////////
/// \brief Helper function which imports a file containing a test suite
/////////////////////////////////////////////////////////////////////
global.importTest = function(name, path){
	if(path == null){ path = name; }

	describe(name, function(){
		require("./" + path);
	});
};

global.expectFail = function(x, args){
	expect(x.status).deep.equal(false);
	if(args.column !== undefined){
		expect(x.index.column).deep.equal(args.column);
	}
	if(args.line !== undefined){
		expect(x.index.line).deep.equal(args.line);
	}
};
