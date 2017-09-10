////////////////////////////////////////////////////////////////////////////
///                       Part of org-parser                             ///
////////////////////////////////////////////////////////////////////////////
/// \file OrgLang.js
/// \author Jamie Terry
/// \date 2017/09/10
/// \brief Defines a parsimmon language for org-mode
////////////////////////////////////////////////////////////////////////////

"use strict";

let P = require('./ParserUtils');

/////////////////////////////////////////////////////////////////////
/// \brief Defines a parser that creates an AstNode
/// \param node_type Value of the 'type' field of the produced AST node
/// \param parser    Parser to use to parse the contents of the AST node
/// \param mapper    Function that is applied as map to result of parser to produce
/// the contents of the AST node
/////////////////////////////////////////////////////////////////////
function defParser(node_type, parser, mapper){
	return {
		type   : node_type,
		parser : parser = parser.mark().map(x => {
			let result = mapper(x.value);
			result.type = node_type;
			result.loc  = {
				start : x.start,
				end   : x.end,
			};
			return result;
		}),
	};
}

let OrgLang = {};

OrgLang.headline = defParser(
	'headline',
	P.seq(
		P.some(P.string('*'   )).skip(P.regex(/[\s\t]*/)),
		P.some(P.noneOf('\r\n')).skip(P.eol).tie()
	),
	x => {
		return {
			level   : x[0].length,
			title   : x[1],
		};
	}
);

module.exports = OrgLang;
