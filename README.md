JsonZipper
=======
Author: Gerard Lamusse

Description: A json object compressor and decompressor written in JavaScript

Why: For multiple similar repeated objects that are not Homogeneous

How: Creates a map array of the keys, together with optional included values.

JsonZipper is also great if you want to still preserve the notion of objects.

Compress on the go
---
So basically as you are generating data objects, you can compress them, leaving you to always have a small memory footprint.

Extract what you need
---
It allows you to use an object in its' 'zipped' state by only extracting one object by index from the array, so memory wise it is great as it will always only have extracted what you want.


Most other compression algorithms have to compress&extract all the data at once.

API
---
Compressing:

	var jZ = new jsonZipper(jsonObj || false, [options]);
	
	jZ.zip() if jsonObj was specified
	
	jZ.compress(obj) if false, and compressing one object at a time
	
	
Extracting

	var jZ = new jsonZipper(zippedObj,true);
	
	jZ.unzip() extract entire object
	
		OR
		
	jZ.extract(index) extract the object at given index
	
	
Other:

	var jZ = new jsonZipper();
	
	jZ.load(jsonObj,false);
	
	jZ.load(zippedObj,true);
	
	jZ.(option_name) = value;
	
	
Options:

	identifiers []: An array of key names that will be used as identifiers.
	
		WARGING: Should be within every object, but repeating, NO Booleans or Integers allowed.
		
		Hint: Most common values that can be guessed/used from previous objects. 
		
	isArray boolean: If _jsonObj is an array or not.
	
	exclude []: An array of key names not to map or zip.
	
	include []: An array of key names which values to include in mapping will need identifiers.
	
	remove []: An array of key names to be removed from the object.
	
	add {}: An object containing key(s) to add, with function(s) which return the value.	
STATS
---
Compressing(Times vary on each test):

	small(1,01 KB) - 1024 to 813 in 1.21ms

	medium(101 KB) - 104418 to 36045 in 5.54ms

	large(9,90 MB) - 10389101 to 3445841 in 414.42ms


Extracting(one object at random index):

	small(1,01 KB) - 813 to 827 in 0.08ms

	medium(101 KB) - 36045 to 36329 in 0.24ms

	large(9,90 MB) - 3445841 to 3446125 in 0.56ms

Notes
---
Homogeneous?: if your data is a Homogeneous Collection (Exactly Same keys then hpack will be better.)

Check the test.html for a short example. Also, if you want just replace the json object within jsonFile.js with your own json object to see how it works.

NB: Not yet for deep objects. If you want to compress an object with layers, do it manually with stages, calling compress function only with a simple object.
