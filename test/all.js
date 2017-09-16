////////////////////////////////////////////////////////////////////////////
///                       Part of org-parser                             ///
////////////////////////////////////////////////////////////////////////////
/// \file all.js
/// \author Jamie Terry
/// \date 2017/09/10
/// \brief Utility file which defines a test suite that includes all other
/// tests for org-parser
////////////////////////////////////////////////////////////////////////////

"use strict";

require('./common');

describe('org-parser', () => {
	importTest('ParserUtils');
	importTest('OrgLang');
	importTest('SplitLines');
	importTest('DocumentOutline');
});
