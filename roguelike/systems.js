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
        var map = null;
        
        for(var i = 0; i < visComps.length; i++){
            myVisComp = visComps[i];            
            myVisComp.view = [];
            
            if(!nf.isDefined(myVisComp.entity.Location)) continue;
            
            myLocComp = myVisComp.entity.Location;
            map = myLocComp.map;
            
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