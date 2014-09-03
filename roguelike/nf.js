

var nf = (function(){
    var _nf = {};
    
    _nf.isDefined = function(val){ return (val != null) && (typeof val !== 'undefined'); };
    _nf.isFunction = function(val){ return (val != null) && (typeof val === 'function'); };
    _nf.isString = function(val){ return (val != null) && (typeof val === 'string'); };
    _nf.isObject = function(val){ return (val != null) && (typeof val === 'object'); };
    
    //todo, optimize sort algo
    _nf.arrayAddSorted = function(val, ary, sortFn){
        for(var i = 0; i < ary.length; i++){
            var cur = ary[i];
            
            if(sortFn(cur)){
                ary.splice(i, 0, val);
                return;
            }
        }
        
        ary.push(val);
    };
    
    _nf.arrayRemove = function(val, ary){
        var idx = ary.indexOf(val);
        
        if(idx > -1){
            ary.splice(idx, 1);
            return true;   
        }
        
        return false;            
    };
    
    _nf.arrayGetRandom = function(ary){
        if(ary.length > 0)
            return ary[nf.random(0, ary.length - 1)];
        else
            return null;
    };
    
    _nf.arrayGetAll = function(ary, fn){
        var newAry = [];
        
        for(var i = 0; i < ary.length; i++){
            var cur = ary[i];
            
            if(fn(cur))
                newAry.push(cur);
        }
        
        return newAry;
    }
    
    _nf.random = function(min, max){
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };

    _nf.rollcheck = function(str, pass){
        var val = _nf.roll(str);	
        return (val >= pass);
    };

    _nf.roll = function(str){ //ie. 3d6
        var idx = str.indexOf('d');
        var sides = str.substring(0, idx);
        var rolls = str.substring(idx + 1, str.length);
        
        var result = 0;
        
        for(r = 0; r < rolls; r++)
            result += _nf.getRandom(1, sides);
        
        return result;
    };
    
    return _nf;
})();