JsonZipper
Author: Gerard Lamusse
Description: A json object compressor and decompressor written in JavaScript
How: Creates a map shortend keys, together with optional shortend values.

Options:
	Exclude shortening of certain keys and values.
	Include shortening of values.
	Remove certain keys and their values.
	Add keys and value returned via function call.
	
Check the text.html for a short example. Also, if you want just replace the json object within jsonFile.js with your own json object to see how it works.

NB: Not for deep objects. If you want to compress an object with layers, do it manually with stages, calling my function only with a simple object.

To come: Adding the map from a previous object, to just add to it.
LOTS MORE, check the commit history.
