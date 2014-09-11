var jsex = (function(){
    var jsex = {};
    
    jsex.system = {};    
    jsex.component = {};    
    jsex.entity = {};
        
    //---systems-----------------------------------
    
    var systems = [];
    var namedSystems = {};
    var updatingSystems = [];
    var defaultFilter = function(){ return true; };
    
    jsex.system.get = function(name){
        if(namedSystems.hasOwnProperty(name))
            return namedSystems[name];
        else
            throw "Unknown system ["+name+"]";
    };
    
    jsex.system.define = function(sys){                
        if(nf.isFunction(sys))
            sys = sys();
        
        if(!nf.isObject(sys))
            throw "Unknown for system ["+sys+"]";
        
        systems.push(sys);
            
        if(sys.hasOwnProperty('name'))
            namedSystems[sys.name] = sys;
        
        if(sys.hasOwnProperty('update'))
            updatingSystems.push(sys);
    };
    
    //---components---------------------------
    
    var componentTemplates = {};
    var components = {};
    var defaultComponent = function(){};
    
    function Component(name){
        this.name = name;
        this.entity = null;            
        
        this.remove = function(){
            nf.arrayRemove(this, components[this.name]);
        
            if(this.entity != null){
                var fn = componentTemplates[this.name];
            
                if(fn.multiple)
                    nf.arrayRemove(this, this.entity[this.name]); 
                else
                    delete this.entity[this.name];
            }
        };
    };
    
    jsex.component.get = function(name){
        if(components.hasOwnProperty(name))
            return components[name];
        else
            return [];
    };
    
    jsex.component.template = function(name, fn, multiple){
        if(!nf.isDefined(fn))
            fn = defaultComponent;
        
        componentTemplates[name] = fn;
        components[name] = [];
        
        if(nf.isDefined(multiple) && multiple)
            fn.multiple = true;
        else
            fn.multiple = false;            
    };
    
    jsex.component.generate = function(name){
        var fn = componentTemplates[name];
        
        if(fn == null)
            throw "Unknown component [" + name + "]";            

        var newComponent = new Component(name);        
                
        components[name].push(newComponent);
        
        var args = Array.prototype.slice.call(arguments);
        args.shift();
        fn.apply(newComponent, args);
        
        return newComponent;
    };
    
    //---entities-----------------------------------
    
    var entities = [];    
    var entityTemplates = {};
    
    function Entity(){
        this.name = 'Entity';
    }
    Entity.prototype.with = function(name){
        var args = Array.prototype.slice.call(arguments);

        var newComponent = jsex.component.generate.apply(name, args);
        newComponent.entity = this;

        if(!this.hasOwnProperty(name))
            this[name] = [];

        var fn = componentTemplates[name];

        if(fn.multiple)
            this[name].push(newComponent);
        else
            this[name] = newComponent;

        console.log('added component ' + name  + ' to ' + this.name);

        return this;
    }
    Entity.prototype.named = function(name){
        this.name = name;
        return this;
    }
    Entity.prototype.remove = function(){
        nf.arrayRemove(this, entities);
    }
    Entity.prototype.decorate = function(templateName){
        var template = null;
    
        if(entityTemplates.hasOwnProperty(templateName))
            template = entityTemplates[templateName];
        else
            throw "Unknown entity template ["+templateName+"]";
                
        var args = Array.prototype.slice.call(arguments);
        
        args.shift(); //remove templateName
        
        template.apply(this, args);
        
        return this;
    }    
    
    jsex.entity.create = function(){
        var newEntity = new Entity();
        entities.push(newEntity);
        return newEntity;
    }
    
    jsex.entity.template = function(name, fn){
        entityTemplates[name] = fn;
    }
    
    jsex.entity.generate = function(templateName){
        var args = Array.prototype.slice.call(arguments);
        
        var newEntity = jsex.entity.create();
        
        newEntity.decorate.apply(newEntity, args);
        
        return newEntity;
    };
    

    
    //---update-------------------------------------
    
    jsex.update = function(){
        console.log('update()');
        
        for(var i = 0; i < updatingSystems.length; i++){
            var sys = updatingSystems[i];
            
            if(sys.hasOwnProperty('component')){                
                var components = jsex.component.get(sys.component);
                
                console.log('  updating ' + sys.name + ' with ' + components.length + ' ' + sys.component + ' component(s):');
                
                var filter = defaultFilter;
                
                if(sys.hasOwnProperty('updatefilter'))
                    filter = sys.updatefilter;
                
                for(var j = 0; j < components.length; j++){
                    var comp = components[j];
                    
                    console.log('    -' + (nf.isDefined(comp.entity) && comp.entity != null ? comp.entity.name  : 'no entity'));
                    
                    if(filter.apply(sys, [comp]))
                        sys.update(comp);
                }
            }else{
                console.log('  updating ' + sys.name);
                sys.update();
            }
        }
    };
    
    return jsex;
})();
