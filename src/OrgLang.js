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

/////////////////////////////////////////////////////////////////////
/// \brief Parses latex equation snippets such as:
/// \( 1 + \frac{1}{2} \)
/// \[ hi \]
///
/// \return
/// {
///   contents : trimed string contents of the block
///   inline   : true if \( \), false if \[ \]
/// }
/////////////////////////////////////////////////////////////////////
OrgLang.equation = defParser(
	'equation',
	P.string('\\')
		.then(P.oneOf('(['))
		.chain((x) => {
			let closer = { '(' : ')', '[' : ']' }[x];
			return P.manyUntil(P.any, P.string('\\' + closer));
		}),
	x => {
		return {
			contents : x.list.join('').trim(),
			inline   : x.last === '\\)',
		};
	}
);

/////////////////////////////////////////////////////////////////////
/// \brief Parses org mode links such as:
/// [[file:test.png]]
/// [[example.com][click here]]
///
///
/// \todo :TODO: parse the target string to get link type etc,
///   see: http://orgmode.org/manual/Internal-links.html,
///        http://orgmode.org/manual/External-links.html
/// \return
/// {
///   target : contents of first  [] - where link is going
///   text   : contents of second [] - text to display, may be undefined
/// }
/////////////////////////////////////////////////////////////////////
OrgLang.link = defParser(
	'link',

	P.string('[[')
		.then(
			P.seq(
				P.manyUntil(P.anyButEol, P.string(']')),
				P.opt(
					P.string('[').then(P.manyUntil(P.anyButEol, P.string(']')))
				)
			)
		)
		.skip(P.string(']')),

	(x) => {
		let text = undefined;
		if(x[1] !== undefined){
			text = x[1].list.join('');
		}

		return {
			target : x[0].list.join(''),
			text   : text,
		};
	}
);

/////////////////////////////////////////////////////////////////////
/// \brief Parses a single line of potentially formatted text
///
/// \return
/// {
///   content   :: [string or span] - array of children, either just
///                plain string of text, or additional span AST nodes
///   style     :: char - one of the span.STYLE_XXX constants
/// }
/////////////////////////////////////////////////////////////////////
OrgLang.span = {
	type   : 'span',
	styles : [
		// see: http://orgmode.org/manual/Emphasis-and-monospace.html
		'' , // No modifiers
		'*', // *bold*
		'_', // _underline_
		'/', // /italic/
		'=', // =verbatim=
		'~', // ~code~
		'+', // +strikethrough+
	]
};

OrgLang.headline = defParser(
	'headline',
	P.seq(
		P.some(P.string('*'   )).skip(P.regex(/[\s\t]*/)),
		P.some(P.noneOf('\r\n')).skip(P.eol).tie()
	),
	x => {
		return {
			level : x[0].length,
			title : x[1],
		};
	}
);

module.exports = OrgLang;
