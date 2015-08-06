var jsonZipper = (function(){
	var jz = function(_jsonObj, _options) {
		var Z = this;
		var MAP = {};
		var rMAP = {};
		var opts = _options && typeof(_options) !== "boolean" ? _options : {};
		/* []: An array of key names that will be used as identifiers.
				WARGING: Should be within every object, but repeating.
				Hint: Most common values that can be guessed/used from previous objects */
		Z.identifiers = opts.identifiers || [];
		/* boolean: If _jsonObj is an array or not */
		Z.isArray = opts.isArray || _jsonObj.constructor === Array;
		/* []: An array of key names not to map or zip */
		Z.exclude = opts.exclude || false;
		/* []: An array of key names which values to include in mapping */
		Z.include = opts.include || false;
		/* []: An array of key names to be removed from the object */
		Z.remove = opts.remove || false;
		/* {}: An object containing key(s) to add, with function(s) which return the value */
		Z.add = opts.add || false;	
		Z.status = "ready to load object";
		
		/* Public Functions */
		
		Z.zip = function() {
			if (Z.status === "zipable") {
				var J = nextObj(true);
				while (J !== false) {
					if (Z.add) {
						for (var key in Z.add) {	  
							if(Z.add.hasOwnProperty(key)){
								J[key] = Z.add[key](J);
							}
						}
					}
					compress(J);
					J = nextObj();
				}
				for (var mkey in MAP) {	  
					if(MAP.hasOwnProperty(mkey) && MAP[mkey] == mkey){
						delete(MAP[mkey]);
					}
				}
				var uzOpts = {I:[],A:Z.isArray,eC:[],iC:[]};
				for (var rkey in rMAP) {	  
					if(rMAP.hasOwnProperty(rkey)){
						if (Z.identifiers.indexOf(rkey) > -1) {
							uzOpts.I.push(rMAP[rkey]);
						}
						if (Z.exclude.indexOf(rkey) > -1) {
							uzOpts.eC.push(rMAP[rkey]);
						}
						if (Z.include.indexOf(rkey) > -1) {
							uzOpts.iC.push(rMAP[rkey]);
						}
					}
				}
				Z.status = "zipped";
				return {M:MAP,D:Z.JO,O:uzOpts};
			} return false;
		};
		Z.unzip = function() {
			if (Z.status === "unzipable") {
				var J = nextObj(true);
				while (J !== false) {
					if (Z.add) {
						for (var key in Z.add) {	  
							if(Z.add.hasOwnProperty(key)){
								J[key] = Z.add[key](J);
							}
						}
					}
					extract(J);
					J = nextObj();
				}
				Z.status = "unzipped";
				return Z.JO;
			} return false;
		};
		Z.ratio = function(result) {
			var endL = JSON.stringify(Z.JO).length+JSON.stringify(MAP).length;
			return ((Z.startLength/endL * 100) - 100) + ' % ::: from '+Z.startLength+' to '+endL;
		};
		Z.load = function(_jsonObj, isJZobj) {
			Z.startLength = 0;
			try {
				var stringIT = JSON.stringify(_jsonObj);
				Z.startLength = stringIT.length;
				Z.JO = JSON.parse(stringIT);
			}
			catch (err) {
				throw "The json object has recursive references or is too big to load into memory";
			}
			if (isJZobj && Z.JO.D && Z.JO.O && Z.JO.M) {
				MAP = Z.JO.M;
				Z.identifiers = Z.JO.O.I || [];
				Z.isArray = Z.JO.O.A;
				Z.exclude = Z.JO.O.eC || false;
				Z.include = Z.JO.O.iC || false;
				Z.JO = Z.JO.D;
				Z.remove = false;
				Z.add = false;	
				Z.status = "unzipable";
			} else {
				Z.status = "zipable";
			}
		};
		
		/* Private Functions */
		
		var arrI = 0;
		var obj = false;
		var nextObj = function(first) {
			if (first) {
				arrI = 0;
				obj = false;
			}
			if (Z.isArray) {
				if (Z.JO[arrI])
					return Z.JO[arrI++];
				else
					arrI = 0;
			} else {
				obj = !obj;
				if (obj)
					return Z.JO;
			}
			return false;
		};
		/* Compress the given object, taking note of the previous object */
		var pIdentifiers = [];
		var prev = false;
		var compress = function(J) {
			var keys = Object.keys(J);
			var i=0;
			var prevSame = prev ? true : false;
			if (Z.identifiers) {
				var x=0;
				for (xend=Z.identifiers.length; x<xend; x++) {
					var ikey = Z.identifiers[x];
					if (rMAP[J[ikey]]) {
						J[ikey] = rMAP[J[ikey]];
					} else {
						J[ikey] = generateKey(J[ikey],true);
					}
					if (!prevSame || pIdentifiers[x]!==J[ikey]) {
						prevSame = false;
						prev = J;
						pIdentifiers[x] = J[ikey];
					}	
				}
			}
			for (iend=keys.length; i<iend; i++) {
				var key = keys[i];
				var value = J[key];
				if (Z.remove && Z.remove.indexOf(key) > -1)
					delete J[key];
				else {
					var nID = key;
					if (rMAP[key] && MAP[rMAP[key]] === key) {
						nID = rMAP[key];
					} else {
						nID = generateKey(key);
					}
					if (Z.include.indexOf(key) > -1) {
						if (prevSame && prev[nID] === value) {	
							delete J[key];
							nID = key;
						}
					}
					if (nID !== key) {
						J[nID] = J[key];
						delete J[key];
					}
				}
			}
		};
		
		/* Extract the given object, taking note of the previous object */
		var extract = function(J) {
			var prevSame = isSame(prev, J);
			if (prevSame) {
				if (Z.include.length > 0) {
					var ic = 0;
					for (xend=Z.include.length; ic<xend; ic++) {
						var icKey = Z.include[ic];
						var mKey = MAP[icKey];
						J[icKey] = prev[mKey];
					}
				}
			} else {
				prev = J;
			}
			var keys = Object.keys(J);	
			if (!prevSame && Z.identifiers) {
				var x=0;
				for (xend=Z.identifiers.length; x<xend; x++) {
					var ikey = Z.identifiers[x];
					if (MAP[J[ikey]]) {
						J[ikey] = MAP[J[ikey]];
					} else
						throw "MAP is corrupted, key can not be found";	
				}
			}
			var i=0;
			for (iend=keys.length; i<iend; i++) {
				var key = keys[i];
				var value = J[key];
				if (Z.remove && Z.remove.indexOf(key) > -1)
					delete J[key];
				else {
					if (MAP[key]) {
						J[MAP[key]] = J[key];
						delete J[key];
					} else {
						if (Z.exclude.indexOf(key) === -1)
							throw "MAP is corrupted, key can not be found";
					}	
				}
			}
		};
		/* Checks if identiifiers match */
		var isSame = function(obj1, obj2) {
			if (Z.identifiers && obj1 && obj2) {
				var x=0;
				for (xend=Z.identifiers.length; x<xend; x++) {
					var key = Z.identifiers[x];
					var mKey = MAP[Z.identifiers[x]]
					if (obj1.hasOwnProperty(mKey)) {
						if(obj2.hasOwnProperty(key) && MAP[obj2[key]] !== obj1[mKey])
							return false;
					} else return false;
				}
			} else return false;
			return true;
		};
		/* Merges an object into the first one, replacing values from the second object into the first if duplicate keys exist */
		var merge = function(obj1,obj2) {
			for (var key in obj2) {	  
				if(obj2.hasOwnProperty(key)) {
					obj1[key] = obj2[key];
				}
			}
		};
		/* Generates a map of ids with the keys of the jsonObj */
		var charIDs = [64];
		var nextAscii = function(i) {
			if (i >= charIDs.length)
				charIDs.push(64);
			charIDs[i]++;
			switch(charIDs[i]) {
				case 91 : charIDs[i] = 97; break;
				case 123 : charIDs[i] = 65; nextAscii(i+1); break;
			}
		};
		var newKey = function() {
			nextAscii(0);
			var k = '';
			for (var i=0; i<charIDs.length; i++)
				k = String.fromCharCode(charIDs[i]) + k;
			if (MAP[k])
				k = newKey();
			return k;
		};
		var generateKey = function(key,value) {
			var nID = key;
			if (!value && Z.exclude && Z.exclude.indexOf(key) > -1) {
				rMAP[key] = key;
				MAP[key] = key;
			} else {
				nID = newKey();
				rMAP[key] = nID;
				MAP[nID] = key;
			}
			return nID;
		};
		
		/* Check if object is given */
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