/* 
	Author: Gerard Lamusse
	Created: 08/2015
	Version: 1.0
	URL: https://github.com/u12206050/jsonZipper
*/

var jsonZipper = (function(){
	var jz = function(_jsonObj, _options, _zipped) {
		var Z = this;
		var MAP = [];
		var miniMap = false;		
		Z.loMem = true;
		/* Public Functions */
		
		Z.zip = function() {
			if (Z.status === "zipable") {
				if (Z.isArray) {
					var x = 0;
					var y = Z.JO.length;
					while (x < y) {
						compress(Z.JO[x++]);
					}
				} else {
					compress(Z.JO);
				}
				Z.status = "zipped";
				return {M:MAP,D:Z.JO};
			} return false;
		};
		Z.unzip = function() {			
			if (Z.status === "unzipable") {
				if (Z.isArray) {
					var x = 0;
					var y = Z.JO.length;
					while (x < y) {
						extract(Z.JO[x++]);
					}
				} else {
					extract(Z.JO);
				}
				Z.status = "unzipped";
				return Z.JO;
			} return false;
		};
		Z.compress = function(obj) {
			if (Z.status === "compressing") {
				miniMap = [];
				Z.JO.push(obj);
				compress(obj);
			} else if (Z.status === "ready to load object") {
				Z.isArray = true;
				Z.status = "compressing";
				Z.JO = [];
				MAP = [];
				miniMap = [];
				Z.JO.push(obj);
				compress(obj);
			} else return false;
			return miniMap.length > 0 ? [obj,miniMap] : [obj];
		};
		Z.getCompressed = function() {
			return {M:MAP,D:Z.JO};
		};
		Z.reset = function() {
			Z.JO = [];
			MAP = [];
			miniMap = [];
			extracted = [];
			prevExtractIndex = false; 
			Z.status = "ready to load object";
		};
		var prevExtractIndex = false; 
		var extracted = [];
		Z.extract = function(ioro) {
			var i = 0;
			if (Z.status === "unzipable" || Z.status === "zipped" || Z.status === "ready to load object") {
				var tmp = null;
				if (ioro.constructor === Array) {
					tmp = ioro[0];
					i = Z.JO.indexOf(tmp);
					if (i < 0 || (Z.loMem && prevExtractIndex !== i)) {
						if (i < 0) {
							if (Z.loMem)
								tmp = JSON.parse(JSON.stringify(ioro[0]));
							else i = Z.JO.push(tmp) - 1;
							if (ioro.length > 1 && ioro[1].constructor === Array)
								ioro[1].forEach(function(v){MAP.push(v);});
						}
						extract(tmp);
					}
				} else {
					i = ioro*1;
					if (i > -1) {
						if (extracted.indexOf(i) > -1) {					
							prev = Z.JO[i];
						} else {
							if (!prevExtractIndex || prevExtractIndex+1 !== ioro) {
								setPrev(i);
							}
							extract(Z.JO[i]);
							extracted.push(i);
						}						
					} else {
						throw "Invalid Index: Could be you have just the zipped object, you need to extract it with jsonZipper.unzip()";
					}
					tmp = Z.JO[i];
				}
				prevExtractIndex = i;
				return tmp;
			}
			return null;
		};
		Z.length = function() {
			return JSON.stringify(Z.JO).length;// + (MAP ? JSON.stringify(MAP).length : 0);
		};
		Z.options = function(opts,isArray) {
			/* []: An array of key names that will be used as identifiers.
				WARGING: Should be within every object, but repeating, NO Booleans or Integers allowed.
				Hint: Most common values that can be guessed/used from previous objects */
			Z.identifiers = 'undefined' !== typeof opts.identifiers ? opts.identifiers : Z.identifiers || [];
			/* boolean: If _jsonObj is an array or not */
			Z.isArray = 'undefined' !== typeof opts.isArray ? opts.isArray : Z.isArray || isArray;
			/* []: An array of key names not to map or zip, can't include numbers, as this corresponds to indices*/
			Z.exclude = 'undefined' !== typeof opts.exclude ? opts.exclude : Z.exclude || [];
			/* []: An array of key names which values to include in mapping will need identifiers */
			Z.include = 'undefined' !== typeof opts.include ? opts.include : Z.include || [];
			/* []: An array of key names to be removed from the object */
			Z.remove = 'undefined' !== typeof opts.remove ? opts.remove : Z.remove || false;
			/* {}: An object containing key(s) to add, with function(s) which return the value */
			Z.add = 'undefined' !== typeof opts.add ? opts.add : Z.add || false;	
		};
		Z.load = function(_jsonObj, _zipped, _options) {
			Z.startLength = 0;
			MAP = [];						
			prev = false;
			prevID = false;
			if (_zipped) {
				if (_jsonObj.D && _jsonObj.M) {
					MAP = _jsonObj.M;
					//var stringIT = JSON.stringify(_jsonObj.D);
					//Z.startLength = stringIT.length;
					Z.JO = _jsonObj.D;//JSON.parse(stringIT);
					Z.status = "unzipable";
				} else
					throw "Object provided doesn't match expected json zipped parameters.";				
			} else {
				try {
					var stringIT = JSON.stringify(_jsonObj);
					Z.startLength = stringIT.length;
					Z.JO = JSON.parse(stringIT);
					Z.status = "zipable";
				}
				catch (err) {
					throw "The json object has recursive references or is too big to load into memory";
				}
			}
			if (_options)
				Z.options(_options,Z.JO.constructor === Array);
			else {
				Z.isArray = Z.isArray || Z.JO.constructor === Array;
			}
		};
		
		/* Private Functions */

		var getID = function(key, value) {	
			var mI = MAP.indexOf(key);
			if (mI < 0) {
				if (value) {
					miniMap ? miniMap.push(key): 0;
					return MAP.push(key) - 1;				
				}
				if (Z.exclude.indexOf(key) > -1)
					return key;
				else {
					miniMap ? miniMap.push(key): 0;
					mI = MAP.push(key) - 1;							
				}
			}
			return mI;
		};

		/* Compress the given object, taking note of the previous object */
		var prev = false;
		var prevID = false;
		var compress = function(J) {
			add(J);
			var keys = Object.keys(J);
			var prevSame = prev ? true : false;
			var id = '';
			var i=0;
			for (xend=Z.identifiers.length; i<xend; i++) {
				var ikey = Z.identifiers[i];
				J[ikey] = getID(J[ikey],1);
				id += J[ikey];
			}
			if (!prevSame || !prevID || prevID !== id) {
				prevSame = false;
				prev = J;
				prevID = id; 
			}			
			for (i=0, iend=keys.length; i<iend; i++) {
				var key = keys[i];
				if (Z.remove && Z.remove.indexOf(key) > -1)
					delete J[key];
				else {
					var mI = getID(key);					
					if (prevSame && (MAP[prev[mI]] === J[key] || prev[mI] === J[key]))
						delete J[key];
					else {
						J[mI] = J[key];
						if (Z.include.indexOf(key) > -1)
							J[mI] = getID(J[key],1);
						if (mI !== key)
							delete J[key];
					}
				}
			}
		};
		
		/* Extract the given object, taking note of the previous object */
		var extract = function(J) {
			if (J === prev)
				return;
			add(J);
			var prevSame = Z.isArray ? isSame(prev, J) : false;			
			var keys = Object.keys(J);
			if (prevSame)
				extend(prev,J);
			else if (Z.identifiers) {
				var x=0;
				for (xend=Z.identifiers.length; x<xend; x++) {
					var ikey = MAP.indexOf(Z.identifiers[x]);
					J[ikey] = MAP[J[ikey]];
				}
			}
			var i=0;
			for (iend=keys.length; i<iend; i++) {
				var key = keys[i];
				if (Z.exclude.indexOf(key) > -1 && Z.include.indexOf(key) > -1) {	
						J[key] = MAP[J[key]];			
				} else {
					key *= 1;
					if (Z.include.indexOf(MAP[key]) > -1)
						J[MAP[key]] = MAP[J[key]];
					else 
						J[MAP[key]] = J[key];
					delete J[key];
				}
			}
			prev = J;
		};
		/* Add the additional keys and values to the given object */
		var add = function(J) {
			if (Z.add) {
				for (var key in Z.add) {	  
					if('undefined' !== typeof Z.add[key]){
						if (typeof(Z.add[key]) === "function")
							J[key] = Z.add[key](J);
						else
							J[key] = Z.add[key];
					}
				}
			}
		};
		/* Set the previous full object from the current index, incl. */
		var setPrev = function(i) {
			if (i > 0) {
				var x=0;
				for (xend=Z.identifiers.length; x<xend; x++) {
					if ('undefined' === typeof Z.JO[i][Z.identifiers[x]]) {
						setPrev(i-1);
						return;
					}
				}
				extract(Z.JO[i]);
			} else 
				extract(Z.JO[0]);
		};
		/* Checks if identiifiers match */
		var isSame = function(obj1, obj2) {
			if (Z.identifiers && obj1 && obj2 && obj1 !== obj2) {
				var x=0;
				for (xend=Z.identifiers.length; x<xend; x++) {
					var key = MAP.indexOf(Z.identifiers[x]);
					var mKey = Z.identifiers[x];
					if ('undefined' === typeof obj1[mKey] || ('undefined' !== typeof obj2[key] && MAP[obj2[key]] !== obj1[mKey]))
						return false;					
				}
			} else return false;
			return true;
		};
		/* Merges an object by reference into the first one, replacing values from the second object into the first if duplicate keys exist */
		var merge = function(obj1,obj2) {
			for (var key in obj2) {	  
				if('undefined' !== typeof obj2[key]) {
					obj1[key] = obj2[key];
				}
			}
		};
		/* Adds all keys and values from the base to obj2 for each key that does not exist in obj2 */
		var extend = function(base,obj2) {
			for (var key in base) {	  
				if('undefined' === typeof obj2[key]) {
					obj2[key] = base[key];
				}
			}
		};
	
		Z.status = "ready to load object";
		
		/* Check if object is given and if options is object or 'compressed' flag */
		if (_jsonObj && typeof(_jsonObj) === "object") {
			Z.load(_jsonObj,!!_zipped,_options);
		} else
			Z.options(_options || {},false);
	};
	return jz;
})();