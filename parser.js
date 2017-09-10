////////////////////////////////////////////////////////////////////////////
///                       Part of org-parser                             ///
////////////////////////////////////////////////////////////////////////////
/// \file parser.js
/// \author Jamie Terry
/// \date 2017/09/10
/// \brief Contains org parser entry point
////////////////////////////////////////////////////////////////////////////

"use strict";

let P = require('parsimmon');

let pDocument = P.string("Hello World");

module.exports = {
	parse(x){
		return pDocument.parse(x);
	},
};