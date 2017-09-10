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

P.many = function(parser){
	return parser.many();
};
P.some = function(parser){
	return P.seq(
		parser,
		parser.many()
	).map(x => {
		x[1].unshift(x[0]);
		return x[1];
	});
};
P.id = function(x){ return x; };

/////////////////////////////////////////////////////////////////////
/// \brief Defines a parser that creates an AstNode
/// \param node_type Value of the 'type' field of the produced AST node
/// \param parser    Parser to use to parse the contents of the AST node
/// \param mapper    Function that is applied as map to result of parser to produce
/// the contents of the AST node
/////////////////////////////////////////////////////////////////////
P.defParser = function(node_type, parser, mapper){
	return parser.mark().map(x => {
		let result = mapper(x.value);
		result.type = node_type;
		result.loc  = {
			start : x.start,
			end   : x.end,
		};
		return result;
	});
};

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
