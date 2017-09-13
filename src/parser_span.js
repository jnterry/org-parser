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

span.parser = function(delimiters){
	if(delimiters === undefined){
		delimiters = '';
	}
	return P((input, i) => {
		let initial_i = i;

		function canOpenSectionAt(i){
			// Can only open section after certain characters
			if(i !== initial_i && !" \t\n\r".includes(input[i-1])){
				//console.log("cant open section due to preceding char");
				return false;
			}

			// Can't open section at last char or if followed by
			if(i+1 < input.length && " \t\n\r".includes(input[i+1])){
				//console.log("cant open section due to following char");
				return false;
			}

			//console.log("Can open section at " + i);
			return true;
		}

		function canCloseSectionAt(i){
			// Cant close at first char, or if previous char was whitespace
			if(i === initial_i || " \t\n\r".includes(input[i-1])){
				//console.log("cant close section due to preceeding char");
				return false;
			}

			// Can close if final char in string, or if followed by whitespace
			if(i+1 < input.length && !" \t\n\r,.!?-".includes(input[i+1])){
				//console.log("cant close section due to following char");
				return false;
			}

			//console.log("Can close section at " + i);
			return true;
		}

		let root = {
			type    : span.type,
			content : [],
			style   : span.styles.NONE,
		};
		let stack = [root];
		let current = root;
		let current_content    = '';

		while(i < input.length && !delimiters.includes(input[i])){
			//console.log(current.style + ": " + input.substr(i));
			let style = format_char_to_style[input[i]];
			if(style !== undefined){
				//console.log("  char is for style: " + style);
				if(style === current.style){
					//console.log("Char is that for current style, checking close");
					if(canCloseSectionAt(i)){
						//console.log("   Closing section");
						if(current_content.trim().length > 0){
							current.content.push(current_content.trim());
							stack.pop();
						} else {
							// Then there was no content in this node, we don't need it
							stack.pop();
							stack[stack.length - 1].content.pop();
						}
						current_content = '';
						current = stack[stack.length - 1];
						++i;
						continue;
					}
				} else {
					//console.log("Char is not for current style, checking open");

					if(canOpenSectionAt(i)){
						//console.log("   Opening section");
						let new_node = {
							type    : span.type,
							content : [],
							style   : style,
						};
						stack.push(new_node);
						if(current_content.trim().length > 0){
							current.content.push(current_content.trim());
						}
						current_content = '';
						current.content.push(new_node);
						current = new_node;
						++i;
						continue;
					}
				}
			}

			current_content += input[i];
			++i;
		}

		// :TODO: what if sections arent closed, eg:
		// *bold _underline_ text
		// in this case we shouldnt have opened the bold section, so if stack
		// contains > 1 element we should push the content up into the parent
		if(current_content.trim().length > 0){
			current.content.push(current_content.trim());
		}

		// Then we've got a useless span containing another
		// just use the inner span
		if(root.content.length  === 1 &&
		   root.content[0].type === span.type
		  ){
			root = root.content[0];
		}

		//console.log("Span parser done");
		//console.log(JSON.stringify(root, null, 4));
		return P.makeSuccess(i, root);
	});
};

module.exports = span;
