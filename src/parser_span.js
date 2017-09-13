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
	return P.index.chain((index) => {
		return P((input, i) => {
			if(i >= input.length){
				return P.makeFailure('Expected some content for span, but EOF encountered');
			}
			let initial_i = i;
			if(i !== index.offset){
				return P.makeFailure('Internal error: span parser got mismatching input offset');
			}

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

				//console.log("Can close section at " + i + " which is a " + input[i]);
				return true;
			}

			let stack = [];
			let current = undefined;
			let current_content    = '';

			function openSection(style){
				let new_node = {
					type    : span.type,
					content : [],
					style   : style,
					loc     : {
						start : {
							offset : index.offset,
							column : index.column,
							line   : index.line,
						},
					},
				};
				stack.push(new_node);
				if(current !== undefined){
					if(current_content.trim().length > 0){
						current.content.push(current_content.trim());
					}
					current_content = '';
					current.content.push(new_node);
				}
				current = new_node;
				return new_node;
			}

			function closeSection(){
				//console.log("   Closing section");
				stack.pop();

				if(current_content.trim().length > 0){
					current.content.push(current_content.trim());
				} else {
					// Then there was no content in this node, we don't need it
					if(stack.length > 1){
						stack[stack.length - 1].content.pop();
					}
				}
				current.loc.end = {
					offset : index.offset,
					column : index.column,
					line   : index.line,
				};
				current_content = '';
				current = stack[stack.length - 1];
			}

			let root = openSection(span.styles.NONE);

			while(index.offset < input.length &&
			      !delimiters.includes(input[index.offset])){
				//console.log(current.style + ": " + input.substr(index.offset));
				let style = format_char_to_style[input[index.offset]];
				if(style !== undefined){
					//console.log("  char is for style: " + style);
					if(style === current.style){
						//console.log("Char is that for current style, checking close");
						if(canCloseSectionAt(index.offset)){
							closeSection();
							++index.offset;
							++index.column;
							continue;
						}
					} else {
						//console.log("Char is not for current style, checking open");

						if(canOpenSectionAt(index.offset)){
							//console.log("   Opening section");
							openSection(style);
							++index.offset;
							++index.column;
							continue;
						}
					}
				}

				current_content += input[index.offset];

				//if(index.offset+1 == input.length || delimiters.includes(input[index.offset+1])){
				//	break;
				//}

				if(input[index.offset] === '\n'){
					index.line++;
					index.column = 1;
				} else {
					index.column++;
				}
				++index.offset;
			}

			// :TODO: what if sections arent closed, eg:
			// *bold _underline_ text
			// in this case we shouldnt have opened the bold section, so if stack
			// contains > 1 element we should push the content up into the parent
			closeSection();

			// Then we've got a useless span containing another
			// just use the inner span
			if(root.content.length  === 1 &&
			   root.content[0].type === span.type
			  ){
				root = root.content[0];
			}


			// +1 so next parser begins after the delimiter that closes this span
			return P.makeSuccess(index.offset+1, root);
		});
	});
};

module.exports = span;
