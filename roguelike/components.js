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

jsex.component.template('Storeable');

jsex.component.template('Inventory', function(){
    this.items = [];
    this.canPickUp = [];
});

jsex.component.template('Equipment', function(){
    this.armor = null;
    this.weapon = null;
    this.leftring = null;
    this.rightring = null;
});

var EquipLocation = { Armor : 0, Weapon : 1, Ring : 2 };

jsex.component.template('Equippable', function(location, cursed, effects){
    this.location = location;//0 -> armor, 1 -> weapon, 2+3 -> rings
    this.cursed = cursed;    //can equipper take it off
    this.effects = effects;  //array of effect components to apply to equipper
});

jsex.component.template('Attack', function(damage){
    this.damage = damage;
});
