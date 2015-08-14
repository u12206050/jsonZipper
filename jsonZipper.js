/* 
	Author: Gerard Lamusse
	Created: 08/2015
	Version: 1.0
	URL: https://github.com/u12206050/jsonZipper
	ALTERED: Always has to be extracted from the start
		can compress and extract at the same time.
*/

var jsonZipper = (function(){
	var jz = function(_options) {
		var Z = this;
		var MAP = [];
		var miniMap = false;

		/* Public Functions */

		Z.compress = function(obj) {
			miniMap = [];
			compress(obj);
			return miniMap.length > 0 ? [obj,miniMap] : [obj];
		};
		Z.reset = function() {
			Z.JO = [];
			MAP = [];
			miniMap = [];
			Z.status = "ready to load object";
		};
		Z.extract = function(ioro) {
			if (ioro.constructor === Array) {
				if (ioro.length > 1 && ioro[1].constructor === Array)
					ioro[1].forEach(function(v){MAP.push(v);});
				extract(ioro[0]);
				return ioro[0];
			} else 
				throw "Invalid jzPart in EventKit";
		};
		Z.getMap = function() {
			return MAP;// + (MAP ? JSON.stringify(MAP).length : 0);
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
		/* Checks if identifiers match */
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
		Z.options(_options || {},false);
	};
	return jz;
})();