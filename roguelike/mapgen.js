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