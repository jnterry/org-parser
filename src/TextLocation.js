////////////////////////////////////////////////////////////////////////////
///                       Part of org-parser                             ///
////////////////////////////////////////////////////////////////////////////
/// \file TextLocation.js
/// \author Jamie Terry
/// \date 2017/09/16
/// \brief Defines the TextLocation type and related functions
////////////////////////////////////////////////////////////////////////////

"use strict";

/////////////////////////////////////////////////////////////////////
/// \brief Represents a position in the text
/////////////////////////////////////////////////////////////////////
function TextLocation(offset, line, column){
	// Index of the character in the input text
	this.offset = offset;

	// 1-based index of the line in the input text
	this.line   = line;

	// 1-based index of the column in the input text
	this.column = column;
}

TextLocation.prototype.clone = function(){
	return new TextLocation(this.offset, this.line, this.column);
};

module.exports = TextLocation;
