JsonZipper
=======
Author: Gerard Lamusse

Description: A json object compressor and decompressor written in JavaScript, Custom verions for on the go.

Why: For multiple similar repeated objects that are not Homogeneous

How: Creates a map array of the keys, together with optional included values.


Compress and Extract now at the same time.
---
Have data coming and going in and out. Compress and Extract your data as you go, by keeping a MAP for both compressing and extracting, it is just awesome.

Sync user data
---
Have users changing data on various locations, lock up the MAP, make a change, sync the data and differences between the MAPs, unlock, and let other users do the same.


Most other compression algorithms have to compress&extract all the data at once.

API
---
Compressing:

	var jZ = new jsonZipper([options]);
	
	jZpart = jZ.compress(obj) 
	
	
Extracting

	var jZ = new jsonZipper([options]);
		
	jZ.extract(jZpart) have to build map then from start, so start with first object 
	
	
Other:
	
	jZ.(option_name) = value;
	
	jZ.reset();
		
		::: Clears all data except options, useful when you want to start extracting directly after compressing.
	
	
Options:

	identifiers []: An array of key names that will be used as identifiers.
	
		WARGING: Should be within every object, but repeating, NO Booleans or Integers allowed.
		
		Hint: Most common values that can be guessed/used from previous objects. 
		
	isArray boolean: If _jsonObj is an array or not.
	
	exclude []: An array of key names not to map or zip.
	
	include []: An array of key names which values to include in mapping will need identifiers.
	
	remove []: An array of key names to be removed from the object.
	
	add {}: An object containing key(s) to add, with function(s) which return the value.	

