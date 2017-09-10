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

let pNewline = P.regex(/\r\n|\n/);
let pEol = P.many(pNewline).or(P.eof);

let pHeadline = P.defParser(
	'headline',
	P.seq(
		P.some(P.string('*'   )).skip(P.regex(/[\s\t]*/)),
		P.some(P.noneOf('\r\n')).skip(pEol).tie()
	),
	x => {
		return {
			level   : x[0].length,
			title   : x[1],
		};
	}
);

module.exports = {
	parse(x){
		return pHeadline.parse(x);
	},
};
