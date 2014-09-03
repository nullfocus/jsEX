
//---Misc classes and definitions------------------------------------------------------------------------------

var MoveNorth       = {dx : 0, dy : -1, dir: 'n',  code : 87};
var MoveNorthEast   = {dx : 1, dy : -1, dir: 'ne', code : 69};
var MoveEast        = {dx : 1, dy :  0, dir: 'e',  code : 68};
var MoveSouthEast   = {dx : 1, dy :  1, dir: 'se', code : 67};
var MoveSouth       = {dx : 0, dy :  1, dir: 's',  code : 88};
var MoveSouthWest   = {dx :-1, dy :  1, dir: 'sw', code : 90};
var MoveWest        = {dx :-1, dy :  0, dir: 'w',  code : 65};
var MoveNorthWest   = {dx :-1, dy : -1, dir: 'nw', code : 81};

var AllMoves = [MoveNorth, MoveNorthEast, MoveEast, MoveSouthEast, MoveSouth, MoveSouthWest, MoveWest, MoveNorthWest];

var Terrain = {
    wall : { name: 'wall', canMoveTo : false, canSeeThrough : false, char : '#' },
    ground : { name: 'ground', canMoveTo : true, canSeeThrough : true, char : ' ' },
    unknown : { name : 'unknown', canMoveTo : false, canSeeThrough : false, char : '?' }
};

function Tile(x, y, map){
    this.x = x;
    this.y = y;
    this.map = map;
    this.terrain = Terrain.wall;
    this.entities = [];
    
    this.canMoveTo = this.terrain.canMoveTo;
    this.canSeeThrough = false;
    this.char = this.terrain.char;
    
}
Tile.prototype.update = function(){
    this.char = this.terrain.char;
    this.canMoveTo = this.terrain.canMoveTo;
    this.canSeeThrough = this.terrain.canSeeThrough;
    
    for(var i = 0; i < this.entities.length; i++){
        var eLocComp = this.entities[i].Location;
        
        if(!eLocComp.canMoveOver){
            this.char = eLocComp.char;
            this.canMoveTo = eLocComp.canMoveOver;
            this.canSeeThrough = eLocComp.canSeeThrough;
        }else{
            if(this.char == ' ')
                this.char = eLocComp.char;            
        }
    }
}
Tile.prototype.setTerrain = function(terrain){
    this.terrain = terrain;
    this.update();
}
Tile.prototype.add = function(entity){
    this.entities.push(entity);
    this.update();
}
Tile.prototype.remove = function(entity){
    this.entities.splice(this.entities.indexOf(entity), 1);
    this.update();
}

function ViewTile(x, y){
    this.x = x;
    this.y = y;
    this.viewable = false;
    this.seen = false;
    this.char = ' ';
    this.terrain = Terrain.unknown;
}

function Map(width, height){
    this.tiles = [];//y,x
    this.rooms = [];    
    this.width = width;
    this.height = height;
    
    var row = null;
    
    for(var y = 0; y < height; y++){
        row = [];
        this.tiles.push(row);
        
        for(var x = 0; x < width; x++){
            row.push(new Tile(x, y, this));
        }
    }
}
Map.prototype.forEachTile = function(fn){
    for(var y = 0; y < this.height; y++){        
        for(var x = 0; x < this.width; x++){
            fn(this.tiles[y][x]);
        }
    }
}
Map.prototype.randomRoomTile = function(){
    var tile, room;
    
    do{
        room = nf.arrayGetRandom(this.rooms);    
        tile = this.tiles[nf.random(room.top, room.bottom)][nf.random(room.left, room.right)]; 
    }while(!tile.canMoveTo)
    
    return tile;    
}
Map.prototype.line = function(tile, x1, y1, fn){
    var x0 = tile.x;
    var y0 = tile.y;
    var dx = Math.abs(x1-x0);
    var dy = Math.abs(y1-y0);
    var sx = (x0 < x1) ? 1 : -1;
    var sy = (y0 < y1) ? 1 : -1;
    var err = dx-dy;

    while(fn(this.tiles[y0][x0])){
        //if ((x0==x1) && (y0==y1)) break;
        var e2 = 2*err;
        if (e2 >-dy){ err -= dy; x0  += sx; }
        if (e2 < dx){ err += dx; y0  += sy; }
    }
}


//---Components------------------------------------------------------------------------------------------------

jsex.component.template('Player');

jsex.component.template('Location', function(map, tile, char, canMoveOver, canSeeThrough){
    this.map = map;
    this.tile = tile;
    this.char = char;
    this.canMoveOver = canMoveOver;     //can something else move here, while this entity is here?
    this.canSeeThrough = canSeeThrough; //can something see through this entity to stuff behind it?    
});

jsex.component.template('Movement', function(){
    this.nextTile = null;
    this.moves = [];
    this.justMoved = true; //initially true so we set up this.moves
});

jsex.component.template('RandomWalk');

jsex.component.template('Vision', function(map){
    this.view = []; //[y][x];
    this.map = map;
    
    for(var y = 0; y < map.height; y++){
        row = [];
        this.view.push(row);        
        for(var x = 0; x < map.width; x++)
            row.push(new ViewTile(x, y));
    }
});

jsex.component.template('BasicVision', function(){
    this.view = [];
});

jsex.component.template('Inventory', function(){
    this.items = [];
    this.canPickUp = [];
});

var EquipLocation = { Armor : 0, Weapon : 1, Ring : 2 };

jsex.component.template('Equipment', function(){
    this.equipment = []; //0 -> armor, 1 -> weapon, 2+3 -> rings
});

jsex.component.template('Storeable');

jsex.component.template('Equippable', function(location, cursed, effects){
    this.location = location;//0 -> armor, 1 -> weapon, 2+3 -> rings
    this.cursed = cursed;    //can equipper take it off
    this.effects = effects;  //array of effect components to apply to equipper
});

jsex.component.template('Attack', function(damage){
    this.damage = damage;
});

//---Systems---------------------------------------------------------------------------------------------------

jsex.system.define({
    name : 'RandomWalkSystem',
    component : 'RandomWalk',
    update : function(comp){            
        comp = comp.entity.Movement;

        if(comp.moves == null || comp.moves.length == 0) return;

        comp.nextTile = nf.arrayGetRandom(comp.moves).tile;
    }
    
});

jsex.system.define({
    name : 'MoveSystem',
    component : 'Movement',
    updatefilter : function(comp){
        return comp.nextTile != null;
    },
    update : function(moveComp){
        var locComp = moveComp.entity.Location;
        
        if(!moveComp.nextTile.canMoveTo){
            console.log('oops, ' + moveComp.entity.name + ' can\'t move there!');
            return;
        }
        
        if(locComp.tile != null){
            locComp.tile.remove(locComp.entity);
        }
        
        locComp.tile = moveComp.nextTile;
        locComp.tile.add(locComp.entity);
        
        moveComp.nextTile = null;
        moveComp.justMoved = true;
        
        moveComp.moves = [];
    }
});

jsex.system.define({
    name : 'VisionSystem',
    component : 'Vision',
    update : function(visComp){
        var entity = visComp.entity;
        var mapTile = entity.Location.tile;
        var map = entity.Location.map;

        if(nf.isDefined(entity.Movement) && entity.Movement.justMoved){
            for(var y = 0; y < map.height; y++)
                for(var x = 0; x < map.width; x++)
                    visComp.view[y][x].viewable = false;
        
            var open = []; //start with current tile
            var closed = [];
            
            var startViewTile = visComp.view[mapTile.y][mapTile.x];
                        
            open.push(visComp.view[mapTile.y][mapTile.x+1]);
            open.push(visComp.view[mapTile.y][mapTile.x-1]);
            open.push(visComp.view[mapTile.y+1][mapTile.x]);
            open.push(visComp.view[mapTile.y-1][mapTile.x]);
            
            while(open.length > 0){
                var curTile = open.pop();
                
                if(closed.indexOf(curTile) > -1)
                    continue;
                
                closed.push(curTile);
                
                if(curTile.viewable)
                    continue;
                
                map.line(mapTile, curTile.x, curTile.y, function(mapLineTile){
                    viewLineTile = visComp.view[mapLineTile.y][mapLineTile.x];                    
                    
                    if(startViewTile != viewLineTile && !mapLineTile.canSeeThrough){    
                        viewLineTile.seen = true;
                        viewLineTile.viewable = true;
                        
                        return false;
                    }else{

                        if(viewLineTile.viewable)
                            return true;
                            
                        viewLineTile.seen = true;
                        viewLineTile.viewable = true;
                        
                        open.push(visComp.view[mapLineTile.y][mapLineTile.x+1]);
                        open.push(visComp.view[mapLineTile.y][mapLineTile.x-1]);
                        open.push(visComp.view[mapLineTile.y+1][mapLineTile.x]);
                        open.push(visComp.view[mapLineTile.y-1][mapLineTile.x]);

                        return true;
                    }                    
                });
            }
        }
        
        map.forEachTile(function(tile){
            var viewTile = visComp.view[tile.y][tile.x];
            
            if(viewTile.viewable){
                viewTile.char = tile.char;
                viewTile.terrain = tile.terrain;
            }
        });
    }
});

jsex.system.define({
    name : 'BasicVisionSystem',
    update : function(){
        var visComps = jsex.component.get('BasicVision');
        var locComps = jsex.component.get('Location');
        var myVisComp = null;
        var locComp = null;
        var myLocComp = null;
        
        for(var i = 0; i < visComps.length; i++){
            myVisComp = visComps[i];            
            myVisComp.view = [];
            
            if(!nf.isDefined(myVisComp.entity.Location)) continue;
            
            myLocComp = myVisComp.entity.Location;
            
            console.log('    -' + myVisComp.entity.name);
            
            for(var j = 0; j < locComps.length; j++){
                locComp = locComps[j];
                
                if(locComp == myLocComp) break;
                
                map.line(myLocComp.tile, locComp.tile.x, locComp.tile.y, function(mapLineTile){
                    if(mapLineTile.x == locComp.tile.x && mapLineTile.y == locComp.tile.y){
                        myVisComp.view.push(locComp.entity);
                        
                        console.log('      !' + myVisComp.entity.name + ' sees ' + locComp.entity.name + '!');
                        
                        return false;                        
                    }
                
                    return mapLineTile.canSeeThrough || mapLineTile == myLocComp.tile;                    
                });
            }        
        }
    }
});

jsex.system.define({
    name : 'CanMoveToSystem',
    component : 'Movement',
    updatefilter : function(moveComp){
        return moveComp.justMoved;
    },
    update : function(moveComp){
        var locComp = moveComp.entity.Location;
        
        var map = locComp.tile.map;
                
        for(var i = 0; i < AllMoves.length; i++){
            var move = AllMoves[i];            
            var newX = locComp.tile.x + move.dx;
            var newY = locComp.tile.y + move.dy;            
        
            if(newX >= 0 && newX < map.width &&
               newY >= 0 && newY < map.height &&
               map.tiles[newY][newX].canMoveTo){
            
                moveComp.moves.push({
                    move : move,
                    tile : map.tiles[newY][newX]
                });
            }
        }
        
        moveComp.justMoved = false;
    }
});

jsex.system.define({
    name : 'CanAttackSystem',
    component : 'Attack',
    updatefilter : function(attackComp){
        return nf.isDefined(attackComp.entity) && attackComp.entity != null;
    },
    update : function(attackComp){
        var locComp = attackComp.entity.Location;
        
        var map = locComp.tile.map;
                
        for(var i = 0; i < AllMoves.length; i++){
            var move = AllMoves[i];            
            var newX = locComp.tile.x + move.dx;
            var newY = locComp.tile.y + move.dy;            
        
            if(newX >= 0 && newX < map.width &&
               newY >= 0 && newY < map.height &&
               map.tiles[newY][newX].canMoveTo){
            
                attackComp.attacks.push({
                    attack : move,
                    tile : map.tiles[newY][newX]
                });
            }
        }
    }
});

jsex.system.define(function(){
    var sys = {
        name : 'PlayerSystem',
        currentPlayer : null,
        update : function(){
            var comps = jsex.component.get('Player');
            
            if(comps.length == 1)
                sys.currentPlayer = comps[0].entity;
            else 
                throw "There isn't exactly one Player component!";
        }
    };
    
    return sys;
});

jsex.system.define({
    name : 'InventorySystem',
    component : 'Inventory',
    update : function(invComp){
        var tile = invComp.entity.Location.tile;
        
        invComp.canPickUp = nf.arrayGetAll(tile.entities, function(entity){ 
            return nf.isDefined(entity.Storeable);
        });
    },
    pickup : function(entity, entityToPickup){
        var tile = entityToPickup.Location.tile;        
        entityToPickup.Location.tile = null;        
        tile.remove(entityToPickup);        
        entity.Inventory.items.push(entityToPickup);
    },
    drop : function(entity, entityToDrop){
        var tile = entity.Location.tile;
        tile.add(entityToDrop);
        entityToDrop.Location.tile = tile;        
        nf.arrayRemove(entityToDrop, entity.Inventory.items);
    }
});

jsex.system.define({
    name : 'EquipmentSystem', //0 -> armor, 1 -> weapon, 2+3 -> rings
    equip : function(entity, item){
        
    },
    unequip : function(entity, item){
        
    }
});


//---Game stuff---------------------------------------------------------------------------------------------------
var map = basicDungeon(80, 30);//new Map(80, 30);

//templates
jsex.entity.template('Actor', function(entity, tile, char){
    entity.add('Location', tile.map, tile, char, false, true)
          .add('Movement');          

    tile.add(entity);
});

jsex.entity.template('NPC', function(entity, tile, char){
    jsex.entity.decorate('Actor', entity, tile, char)
         .add('BasicVision')
         .add('RandomWalk');
});

jsex.entity.template('Item', function(entity, tile, char){
    entity.add('Location', tile.map, tile, char, true)
          .add('Storeable');

    tile.add(entity);          
});

jsex.entity.template('Weapon', function(entity, tile, char, damage){
    var attack = jsex.component.generate('Attack', damage);
    
    jsex.entity.decorate('Item', entity, tile, char)
          .add('Equippable', EquipLocation.Weapon, false, [attack]);
});


//actual entities
var tile = map.randomRoomTile();

jsex.entity.generate('Actor', tile, '@')
     .setName('player')
     .add('Vision', tile.map)
     .add('Player')
     .add('Inventory')
     .add('Equipment');

jsex.entity.generate('NPC', map.randomRoomTile(), 'b')
     .setName('bat');

jsex.entity.generate('Weapon', map.randomRoomTile(), '$', '2d6')
     .setName('knife');

