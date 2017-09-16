////////////////////////////////////////////////////////////////////////////
///                       Part of org-parser                             ///
////////////////////////////////////////////////////////////////////////////
/// \file index.js
/// \author Jamie Terry
/// \date 2017/09/10
/// \brief Contains main org mode parser
///
/// Parsing is split into the following phases:
/// 1. Document Outline
///    Generates an array of "Section"s representing the document's heading
///    structure
///
/// 2. Blocks
///    Splits a section into blocks of text, split by empty lines or
///    #+BEGIN_XXX #+END_XXX directives
///
/// 3. Contents
///    Examines blocks to produce content nodes, eg, tables, equations,
///    spans of formatted text (eg, *bold*, /italic/) etc
///
///
/// This means we can generate a rough outline of the document's structure VERY
/// quickly without doing much parsing work. This can be useful for:
///
/// - If we only care about the overall structure of the document
/// - Subsequent phases could potentially be run in parallel on different
///   sections of the document
/// - We could take hashes of the contents of each large block and re-use
///   previous parse results if the hash is unchanged (good for real time editor)
/// - Much easier to recover from errors (if an error occurs in some small section
///   we just skip it preventing errors like an unclosed block from cascading
///   and corrupting the entire document (eg, opened latex block with \[ but never closed)
///   we can generate error as soon as we hit the end of the block, and not assume
///   the rest of the document is a latex fragment).
////////////////////////////////////////////////////////////////////////////
"use strict";

let TextLocation = require('./TextLocation');
let ParseResult  = require('./ParseResult');

let AstNode = function(type, start, end, data){
	this.type = type;
	this.loc = {};
	this.loc.start = start;
	this.loc.end   = end;
	if(data != null){
		for(let k in data){
			this[k] = data[k];
		}
	}
};
AstNode.prototype.fmap = function(f){ f(this); };

/////////////////////////////////////////////////////////////////////
/// Creates a new OrgParser with specified options
/// :TODO: tab_width option
/// :TODO: allowed todo states option (see #+TODO directive or org-todo-keywords variable)
/////////////////////////////////////////////////////////////////////
function OrgParser(){
	this.tab_width = 4;
}

/////////////////////////////////////////////////////////////////////
/// \brief Splits an input text into an array of lines of the following form
/// {
///   content :: string (Lines content)
///   loc     :: {   (object describing location of line)
///     start :: TextLocation,
///     end   :: TextLocation,
///   }
/// }
/////////////////////////////////////////////////////////////////////
OrgParser.prototype.splitLines = function(input){
	let lines = input.split("\n");

	// Remove empty last line if file ends with trailing \n
	if(lines[lines.length-1].length === 0){
		lines.pop();
	}

	let offset = 0;

	for(let i = 0; i < lines.length; ++i){

		let line = {
			content : lines[i],
			loc : {
				start : new TextLocation(offset, i+1, 1),
			}
		};

		let line_delta = lines[i].length + 1; // +1 for the \n that would have ended the line

		offset += line_delta;

		line.loc.end = new TextLocation(offset, i+1, line_delta);

		lines[i] = line;
	}

	if(input[input.length-1] !== '\n'){
		// Then last line isn't terminated with a \n
		lines[lines.length-1].loc.end.offset--;
		lines[lines.length-1].loc.end.column--;
	}

	return lines;
};

/////////////////////////////////////////////////////////////////////
/// \brief Represents a Section of an org mode document
/// Sections are headed with a line like:
/// * Heading 1
/// and continue until the next such line
/////////////////////////////////////////////////////////////////////
function Section(heading, level, start){
	// :TODO: parse the heading to get:
	// TODO status, section title, tags
	// eg:
	// * TODO Title words go here :taga:tagb:

	// Full content of the heading line (excluding the leading stars)
	this.heading = heading;

	// Number of stars before the heading
	// Special level 0 section represents the whole document and contains
	// an contents before the first section is opened
	this.level = level;

	this.content = new AstNode('section_content', null, null, { unparsed: true });

	this.loc = {
		start : start,
		end   : null,
	};

	// Array of child sections
	this.children = [];
}
Section.prototype.fmap = function(f){
	f(this);
	for(let i = 0; i < children.length; ++i){
		children[i].fmap(f);
	}
};


/////////////////////////////////////////////////////////////////////
/// Parses the outline of a org document by locating the section
/// headers:
/// * Heading 1
/// ** Heading 1.1
/// ** Heading 1.2
/// * Heading 2
/// ** Heading 2.1
/// *** Heading 2.1.1
/// *** Heading 2.1.2
/// @param lines Array of lines in the org-mode document or string
/// @return array of objects of following type:
/// {
///   level      :: int    (number of stars preceeding section title),
///   heading    :: string (full text contents of headline)
///   loc        :: { start :: TextLocation, end :: TextLocation }
///   content    :: {
///     loc :: { start :: TextLocation, end :: TextLocation }
///   }
/// }
/////////////////////////////////////////////////////////////////////
OrgParser.prototype.parseDocumentOutline = function(lines){
	if(typeof lines === 'string' || lines instanceof String){
		lines = this.splitLines(lines);
	}

	let result = new ParseResult();

	let root    = new Section('', 0, new TextLocation(0,1,1));
	if(lines.length > 0 && lines[0].content[0] !== '*'){
		// then the section contains content
		root.content.loc.start = lines[0].loc.start.clone();
	}
	let stack   = [root];

	for(let i = 0; i < lines.length; ++i){

		let level = 0;
		while(lines[i].content[level] === '*'){ ++level;}

		if(level > 0){
			// then we found a new headline

			// Create new section
			let headline = lines[i].content.substr(level).trim();
			let new_section = new Section(headline, level, lines[i].loc.start.clone());
			if(i+1 < lines.length && lines[i+1].content[0] !== '*'){
				// then the section contains content
				new_section.content.loc.start = lines[i+1].loc.start.clone();
			}

			let current = stack[stack.length-1];

			if(current.level < level){
				// Then we've found a child of current

				if(current.level < level-1){
					result.appendError(new ParseResult.Error(
						lines[i].loc.start.clone(),
						lines[i].loc.end.clone(),
						"Attempted to open level " + level + " heading as direct child of level " + current.level + " heading"
					));
				}

				if(current.children.length === 0){
					// Then this is first child of parent, close the content section
					if(current.content.loc.start !== null){
						current.content.loc.end = lines[i-1].loc.end.clone();
					}
				}

				current.children.push(new_section);
				stack.push(new_section);
			} else {
				// Then we've found a sibling of current or one of its ancestors
				do {
					// Close previous sibling

					if(current.content.loc.end == null && current.content.loc.start !== null){
						current.content.loc.end = lines[i-1].loc.end.clone();
					}
					current.loc.end = lines[i-1].loc.end.clone();

					stack.pop();
					current = stack[stack.length-1];
				} while(current.level >= new_section.level);

				stack[stack.length-1].children.push(new_section);
				stack.push(new_section);
			}
		}
	}

	// Pop of the stack closing all sections as we go
	let last_line = lines[lines.length - 1];
	while(stack.length > 0){
		let current = stack[stack.length-1];

		if(current.content.loc.end == null && current.content.loc.start !== null){
			current.content.loc.end = last_line.loc.end.clone();
		}
		current.loc.end = last_line.loc.end.clone();

		stack.pop();
	}

	//console.log("------------------------------");
	//console.log("Done outline parse");
	//console.log(JSON.stringify(root, null, 2));
	//console.log("------------------------------");

	result.value = root;
	return result;
};


/////////////////////////////////////////////////////////////////////
/// Represents a block of text, that may or may not be wrapped in
/// #+BEGIN_XXX
/// #+END_XXX
/// directives
///
/// If not wrapped in text then implicitly broken by a blank new line
/////////////////////////////////////////////////////////////////////
function Block(type, start, end, children){
	// Index of first and last line of section's contents (IE: exluding #+BEGIN and #+END lines)
	this.content_start = start;
	this.content_end   = end;

	// Array of child Block instances,
	// used to represent nested #+BEGIN #+END statements
	this.children = children;

	// String representing the type of block
	// For example, would be "SRC" for "#+BEGIN_SRC c++ -n 20"
	// set to null if this Block isn;t surrounded with #+BEGIN #+END lines
	this.type = null;

	// String representing the arguments to the block
	// For example, would be "c++ -n 20" for "#+BEGIN_SRC c++ -n 20"
	// set to null if this Block isn;t surrounded with #+BEGIN #+END lines
	this.args = null;
}

/////////////////////////////////////////////////////////////////////
/// Parses a section of an org-mode document
/// @param Array of lines representing the entire document
/// @param start Index of the first line of the section (excluding the section header)
/// @param end   Index of the last line of the section
/// @return Array of Block's making up the section
/////////////////////////////////////////////////////////////////////
OrgParser.prototype.parseSection = function(lines, start, end){

};

OrgParser.prototype.parse = function(input){
	let lines = this.splitLines(input);

	//console.log("Got lines:");
	//console.dir(lines);

	let sections = this.parseDocumentOutline(lines);

	let root = {};
	if(sections.length === 1){
		root = new AstNode('section', {}, {}, {});
	} else {
		root = new AstNode('document', {}, {}, {});
	}
	let result = new ParseResult();

	result.root = root;

	return result;
};

module.exports = {
	Parser       : OrgParser,
	ParseResult  : ParseResult,
	TextLocation : TextLocation,
};
