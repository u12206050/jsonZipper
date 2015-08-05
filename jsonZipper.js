var jsonZipper = (function(){
	var jz = function(_jsonObj, _options) {
		var Z = this;
		var MAP = {};
		var rMAP = {};
		Z.startLength = 0;
		try {
			var stringIT = JSON.stringify(_jsonObj);
			Z.startLength = stringIT.length;
			Z.JO = JSON.parse(stringIT);
		}
		catch (err) {
			throw "The json object has recursive references or is too big to load into memory";
		}
		var opts = _options || {};
		/* []: An array of key names that will be used as identifiers.
				WARGING: Should not be unique identifiers unless they are repeated
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
		/* boolean: It stores only one value for a set of objects in the first case containing the same value until it changes */
		Z.dynamicDiff = opts.dynamicDiff || false;
		/* Public Functions */
		
		Z.zip = function() {
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
					delete(mkey);
				}
			}
			return {map:MAP,data:Z.JO};
		};
		Z.unzip = function() {

		};
		Z.ratio = function(result) {
			var endL = JSON.stringify(Z.JO).length+JSON.stringify(MAP).length;
			return (Z.startLength/endL * 100) + ' % ::: from '+Z.startLength+' to '+endL;
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
		/*  */
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
					if (!prevSame || pIdentifiers[x]!==rMAP[J[ikey]]) {
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
						}
					}
					if (nID !== key) {
						J[nID] = J[key];
						delete J[key];
					}
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
	};
	return jz;
})();