////////////////////////////////////////////////////////////////////////////
///                       Part of org-parser                             ///
////////////////////////////////////////////////////////////////////////////
/// \file parser_span.js
/// \author Jamie Terry
/// \date 2017/09/10
/// \brief Exports parser for org-mode span
////////////////////////////////////////////////////////////////////////////

"use strict";

let span = {
	type   : 'span',
	styles : {
		NONE          : 0, // no style, falsey value for comparisons
		BOLD          : 1, // *bold*
		UNDERLINE     : 2, // _underline_
		ITALIC        : 3, // /italic/
		VERBATIM      : 4, // =verbatim=
		CODE          : 5, // ~code~
		STRIKETHROUGH : 6, // +strikethrough+
		SUPERSCRIPT   : 7, // ^a   ^{hello world}
		SUBSCRIPT     : 8, // _a   _{hello world}
	},
};

let format_char_to_style = {
	'*' : span.styles.BOLD,
	'_' : span.styles.UNDERLINE,
	'/' : span.styles.ITALIC,
	'=' : span.styles.VERBATIM,
	'~' : span.styles.CODE,
	'+' : span.styles.STRIKETHROUGH,
};

/*OrgLang.span.parser = function(extra_delimiters){
	let formatters = "*_/=~+^";
	let delimiters = formatters;
	if(extra_delimiters !== undefined){
		delimiters += extra_delimiters;
	}

	let pFormatSectionOpener = P.seq(
		P.oneOf(formatters),         // format char
		P.lookahead(P.noneOf(' \t')) // non-whitespace
	);

	return pLineLeadingWhitespace
		.then(P.opt(pFormatSectionOpener))
		.chain((opener) => {
			let untils = [
				// Open a new formatted section with:
				P.lookahead(
					P.seq(P.some(P.oneOf(' \t')),
					      pFormatSectionOpener
					     )
				),

				// End of line
				P.eol,
			];

			if(opener !== undefined){
				// Then also end section with symbol to close this block's formatting
				untils.push(
					P.seq(
						P.
						P.string(opener[0]),
						P.lookahead(P.alt(P.oneOf(' \t'), P.eol))
					)
				);
			}

			return P.manyUntil(P.any,
			                   P.alt(...untils)
			                  ).mark()
				.map((x) => {
					console.log("Span parser done, got: ");
					console.log("Opener: ");
					console.dir(opener);
					console.log("Content: ");
					console.dir(x);
					return {};
				});
		});
		};*/

span.parser = function(delimiters){
	if(delimiters === undefined){
		delimiters = '';
	}
	return P((input, i) => {
		let root = {
			type : OrgLang.span.parser,
		};

		let initial_i = i;

		function canOpenSectionAt(i){
			// Can only open section after certain characters
			if(i !== initial_i && !" \t\n\r".includes(input[i-1])){
				console.log("cant open section due to preceding char");
				return false;
			}

			// Can't open section at last char or if followed by
			if(i+1 < input.length && " \t\n\r".includes(input[i+1])){
				console.log("cant open section due to following char");
				return false;
			}

			console.log("Can open section at " + i);
			return true;
		}

		function canCloseSectionAt(i){
			// Cant close at first char, or if previous char was whitespace
			if(i === initial_i || " \t\n\r".includes(input[i-1])){
				console.log("cant close section due to preceeding char");
				return false;
			}

			// Can close if final char in string, or if followed by whitespace
			if(i+1 < input.length && !" \t\n\r,.!?-".includes(input[i+1])){
				console.log("cant close section due to following char");
				return false;
			}

			console.log("Can close section at " + i);
			return true;
		}

		let content = "";

		let current_style      = span.styles.NONE;
		let current_style_char = '';

		while(i < input.length && !delimiters.includes(input[i])){
			console.log(current_style + ": " + input.substr(i));
			let style = format_char_to_style[input[i]];
			if(style !== undefined){
				console.log("  char is for style: " + style);
				if(style === current_style){
					console.log("Char is that for current style, checking close");
					if(canCloseSectionAt(i)){
						console.log("   Closing section");
						current_style      = span.styles.NONE;
						current_style_char = '';
						++i;
						continue;
					}
				} else {
					console.log("Char is not for current style, checking open");

					if(canOpenSectionAt(i)){
						console.log("   Opening section");
						current_style = style;
						current_style_char = input[i];
						++i;
						continue;
					}
				}
			}

			content += input[i];
			++i;
		}

		console.log("Span parser done");
		console.dir(content);
		return content;
	});
};

module.exports = span;
