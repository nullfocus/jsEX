
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

//---map generation stuff------------------------------------------------------------------------------

function Room(x, y, width, height){
    this.top = y;
    this.right = x + width;
    this.bottom = y + height;
    this.left = x;
    this.centerX = Math.floor(x + (width/2));
    this.centerY = Math.floor(y + (height/2));
    this.connectedRoom = null;
}
Room.prototype.intersects = function(room){
    return !(this.left   > room.right  + 3
          || this.right  < room.left   - 3
          || this.top    > room.bottom + 3
          || this.bottom < room.top    - 3
    );
};
Room.prototype.distance = function(room){
    var x = this.centerX - room.centerX;
    var y = this.centerY - room.centerY;
    
    return Math.sqrt((x*x) + (y*y));
};

function basicDungeon(width, height){
    console.log('generating dungeon '+width+'x'+height);
    
    var map = new Map(width, height);
    var rooms = map.rooms;
    
    var iterations = 0;

    for(var i = 0; i < 20; i++){
        var valid = false;
    
        while(!valid){
            iterations++;

            if(iterations > 10000)
                break;

            var width = nf.random(3, 15);
            var height = nf.random(3, 15);
            var x = nf.random(1, map.width - width - 2);
            var y = nf.random(1, map.height - height - 2);
        
            var room = new Room(x, y, width, height);
            
            valid = true;
            
            for(var j = 0; j < rooms.length; j++){
                if(room.intersects(rooms[j])){
                    valid = false;
                    break;
                }
            }
            
            if(valid){
                rooms.push(room);
            }
        }

        if(iterations > 10000)
            break;
    }
    
    if(iterations > 10000)
        console.log('hit iteration limit!');
    
    //dig out each room and tunnel to the next closest
    for(var r = 0; r < rooms.length; r++){
        var room = rooms[r];
        
        //dig out the rooms...
        for(var x = room.left; x <= room.right; x++){
            for(var y = room.top; y <= room.bottom; y++){
                map.tiles[y][x].setTerrain(Terrain.ground);
            }
        }
        
        //now find the closest room for tunneling
        var closest = null;
        var closestDist = 0;
        
        for(var s = 0; s < rooms.length; s++){
            if(s == r) continue; //skip room=room
            
            if(rooms[s].connectedRoom == null){
                var dist = room.distance(rooms[s]);
                
                if(closest == null || closestDist > dist){
                   closest = rooms[s];
                   closestDist = dist;
                }
            }
        } 
        
        if(closest != null){
            //create a tunnel to the closest room...
            room.connectedRoom = closest;
            
            var startX = room.centerX;
            var startY = room.centerY;

            var endX = closest.centerX;
            var endY = closest.centerY;

            for (var x = startX; x != endX; x += (startX < endX ? 1 : -1)){
                map.tiles[startY][x].setTerrain(Terrain.ground);
            }

            for (var y = startY; y != endY; y += (startY < endY ? 1 : -1)){
                map.tiles[y][endX].setTerrain(Terrain.ground);
            }
        }
    }
    
    console.log('done generating dungeon');
    
    return map;
}