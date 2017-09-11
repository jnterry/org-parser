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
/// \brief Returns a parser which greedily invokes the parser `pa` as many
/// times as possible, until the parser `pb` succeeds.
/// Parser will yield object of the form:
/// { list : [values_of_type_yielded_by_pa],
///   last : value_of_type_yielded_by_pb
/// }
/// Parser fails if pa fails before pb succeeds, or EOF is encountered before
/// pb succeeds
/////////////////////////////////////////////////////////////////////
P.manyUntil = function(pa, pb){
	return P(function (input, i){

		let result = {
			list: [],
			last: undefined,
		};

		while(i <= input.length){
			let rest = input.substr(i);
			let b = P.seq(pb.mark(), P.all).parse(rest);
			if(b.status === true){
				result.last = b.value[0].value;
				i += (b.value[0].end.offset - b.value[0].start.offset);
				break;
			}

			let a = P.seq(pa.mark(), P.all).parse(rest);

			if(a.status === true){
				result.list.push(a.value[0].value);
				i += (a.value[0].end.offset - a.value[0].start.offset);
			} else {
				return P.makeFailure(i, [a.expected, b.expected]);
			}
		}

		return P.makeSuccess(i, result);
	});
};

/////////////////////////////////////////////////////////////////////
/// \brief As with manyUntil, but list part must contain at least 1
/// element
/////////////////////////////////////////////////////////////////////
P.someUntil = function(pa, pb){
	return P(function (input, i){

		let rest = input.substr(i);

		let b = pb.mark().skip(P.all).parse(rest);
		if(b.status === true){
			return P.makeFailure(i, "until part matched before some part");
		}

		let a = pa.mark().skip(P.all).parse(rest);
		if(a.status === false){
			return P.makeFailure(i, a.expected);
		}

		i += (a.value.end.offset - a.value.start.offset);

		let result = P.manyUntil(pa, pb).mark().skip(P.all).parse(input.substr(i));

		if(result.status === false){
			return P.makeFailure(i + result.index.offset, result.expected);
		}

		i += (result.value.end.offset - result.value.start.offset);

		result.value.value.list.unshift(a.value.value);
		return P.makeSuccess(i, result.value.value);
	});
};

/////////////////////////////////////////////////////////////////////
/// \brief Returns a parser which will yield the result of p if it can,
/// but otherwise yields undefined and consumes no input if p fails
/////////////////////////////////////////////////////////////////////
P.opt = function(p){
	return P(function(input, i){
		let rest = input.substr(i);

		let x = p.mark().skip(P.all).parse(rest);

		if(x.status === true){
			return P.makeSuccess(i + (x.value.end.offset - x.value.start.offset), x.value.value);
		}

		return P.makeSuccess(i, undefined);
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

/////////////////////////////////////////////////////////////////////
/// \brief Parser which matches any character except an end of line, that
/// is a newline character or the end of file
/////////////////////////////////////////////////////////////////////
P.anyButEol = P.noneOf('\r\n');

module.exports = P;
