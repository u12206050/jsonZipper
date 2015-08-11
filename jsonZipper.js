/* 
	Author: Gerard Lamusse
	Created: 08/2015
	Version: 1.0
	URL: https://github.com/u12206050/jsonZipper
*/

var jsonZipper = (function(){
	var jz = function(_jsonObj, _options) {
		var Z = this;
		var MAP = [];
		var opts = _options && typeof(_options) !== "boolean" ? _options : {};		
		
		/* Public Functions */
		
		Z.zip = function() {
			if (Z.status === "zipable") {
				Z.uzOpts = {I:[],A:Z.isArray,eC:[],iC:[]};
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
				return {M:MAP,D:Z.JO,O:Z.uzOpts};
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
				Z.JO.push(obj);
				compress(obj);
			} else if (Z.status === "ready to load object") {
				Z.isArray = true;
				Z.uzOpts = {I:[],A:Z.isArray,eC:[],iC:[]};
				Z.status = "compressing";
				Z.JO = [];
				Z.JO.push(obj);
				compress(obj);
			} else return false;
			return {M:MAP,D:Z.JO,O:Z.uzOpts};
		};
		var prevExtractIndex = false; 
		var extracted = [];
		Z.extract = function(i) {
			if (Z.status === "unzipable" || Z.status === "zipped") {
				if (extracted.indexOf(i) > -1) {					
					prev = Z.JO[i];
				} else {
					if (!prevExtractIndex || prevExtractIndex+1 !== i) {
						setPrev(i);
					}
					extract(Z.JO[i]);
					extracted.push(i);
				}
				prevExtractIndex = i;
			}
			return Z.JO[i];
		};
		Z.length = function() {
			return JSON.stringify(Z.JO).length + (MAP ? JSON.stringify(MAP).length : 0);
		};
		Z.options = function(opts,isArray) {
			/* []: An array of key names that will be used as identifiers.
				WARGING: Should be within every object, but repeating, NO Booleans or Integers allowed.
				Hint: Most common values that can be guessed/used from previous objects */
			Z.identifiers = opts.identifiers || [];
			/* boolean: If _jsonObj is an array or not */
			Z.isArray = opts.isArray || isArray;
			/* []: An array of key names not to map or zip */
			Z.exclude = opts.exclude || [];
			/* []: An array of key names which values to include in mapping will need identifiers */
			Z.include = opts.include || [];
			/* []: An array of key names to be removed from the object */
			Z.remove = opts.remove || false;
			/* {}: An object containing key(s) to add, with function(s) which return the value */
			Z.add = opts.add || false;	
		}
		Z.load = function(_jsonObj, isJZobj) {
			Z.startLength = 0;
			MAP = [];
			try {
				var stringIT = JSON.stringify(_jsonObj);
				Z.startLength = stringIT.length;
				Z.JO = JSON.parse(stringIT);
			}
			catch (err) {
				throw "The json object has recursive references or is too big to load into memory";
			}

			Z.status = "zipable";
			if (isJZobj) {
				if (Z.JO.D && Z.JO.O && Z.JO.M) {
					MAP = Z.JO.M;
					Z.identifiers = Z.JO.O.I || [];
					Z.isArray = Z.JO.O.A;
					Z.exclude = Z.JO.O.eC || false;
					Z.include = Z.JO.O.iC || false;
					Z.JO = Z.JO.D;
					Z.remove = false;
					Z.add = false;	
					Z.status = "unzipable";
				} else 
					Z.options(isJZobj,_jsonObj.constructor === Array);
			}
			prev = false;
			prevID = false;
		};
		
		/* Private Functions */

		var getID = function(key, value) {	
			var mI = MAP.indexOf(key);
			if (mI < 0) {
				if (value) {
					return MAP.push(key) - 1;
				}
				if (Z.exclude.indexOf(key) > -1) {
					Z.uzOpts.eC.push(key);
					return key;
				} else {
					mI = MAP.push(key) - 1;
					if (Z.identifiers.indexOf(key) > -1) {
						Z.uzOpts.I.push(mI);
					}
					if (Z.include.indexOf(key) > -1) {
						Z.uzOpts.iC.push(mI);
					}
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
			i=0;
			for (iend=keys.length; i<iend; i++) {
				var key = keys[i];
				if (Z.remove && Z.remove.indexOf(key) > -1)
					delete J[key];
				else {
					var mI = getID(key);
					if (prevSame && (MAP[prev[mI]] === J[key] || prev[mI] === J[key]))
						delete J[key];
					else if (Z.include.indexOf(key) > -1) {
						if (Z.identifiers.indexOf(key) > -1) 
							J[mI] = J[key];
						else J[mI] = getID(J[key],1);
						delete J[key];
					} else if (mI !== key) {
						J[mI] = J[key];
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
					var ikey = Z.identifiers[x];
					J[ikey] = MAP[J[ikey]];
				}
			}
			var i=0;
			for (iend=keys.length; i<iend; i++) {
				var key = keys[i]*1;
				var value = J[key];
				if (Z.remove && Z.remove.indexOf(key) > -1)
					delete J[key];
				else {
					if (Z.exclude.indexOf(key) > -1) {
						J[key] = J[key];
						if (Z.include.indexOf(key) > -1)
							J[key] = MAP[J[key]];
					} else {
						if (Z.include.indexOf(key) > -1)
							J[MAP[key]] = MAP[J[key]];
						else 
							J[MAP[key]] = J[key];
						delete J[key];
					}
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
					var key = Z.identifiers[x];
					var mKey = MAP[Z.identifiers[x]];
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

		Z.setID = opts.setID || false;
		Z.options(opts,_jsonObj.constructor === Array)
		Z.status = "ready to load object";
		
		/* Check if object is given and if options is object or 'compressed' flag */
		if (_jsonObj && typeof(_jsonObj) === "object") {
			/* When unzipping an object ensure _options is true and not an object, once loaded, you can set the options */
			if (_options && typeof(_options) === "boolean") {
				Z.load(_jsonObj,true);
			} else {
				Z.load(_jsonObj,false);
			}
		}
	};
	return jz;
})();