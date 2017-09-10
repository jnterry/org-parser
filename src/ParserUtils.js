////////////////////////////////////////////////////////////////////////////
///                       Part of org-parser                             ///
////////////////////////////////////////////////////////////////////////////
/// \file ParserUtils.js
/// \author Jamie Terry
/// \date 2017/09/10
/// \brief Defines a object with various utilities for defining parsers using
/// parser combinator like interface.
/// Really just an extension of the parsimmon library
///
/// \todo :TODO: should this be a seperate module? its not specific to org parser
////////////////////////////////////////////////////////////////////////////

"use strict";

let P = require('parsimmon');

/////////////////////////////////////////////////////////////////////
/// \brief Defines the many combinator, yields array of values returned
/// by each invocation of parser. Final array may contain 0 elements.
/////////////////////////////////////////////////////////////////////
P.many = function(parser){
	return parser.many();
};

/////////////////////////////////////////////////////////////////////
/// \brief Defines the some combinator, yields an array of values returned by
/// each invocation of parser. Final array must contain at least 1 element.
/////////////////////////////////////////////////////////////////////
P.some = function(parser){
	return P.seq(
		parser,
		parser.many()
	).map(x => {
		x[1].unshift(x[0]);
		return x[1];
	});
};

/////////////////////////////////////////////////////////////////////
/// \brief Identity function - does nothing
/////////////////////////////////////////////////////////////////////
P.id = function(x){ return x; };

/////////////////////////////////////////////////////////////////////
/// \brief Defines a parser matches a newline
/////////////////////////////////////////////////////////////////////
P.newline = P.alt(
	P.string('\n'  ),
	P.string('\r\n')
);

/////////////////////////////////////////////////////////////////////
/// \brief Defines a parser that matches the end of a line, that is,
/// a newline or end of file
/////////////////////////////////////////////////////////////////////
P.eol = P.alt(P.newline, P.eof);

module.exports = P;