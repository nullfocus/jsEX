//---entity templates--------------------------------------------------------------------------------------------

jsex.entity.template('Actor', function(name, tile, char){
    this.named(name)
        .with('Location', tile.map, tile, char, false, true)
        .with('Movement');          

    tile.add(this);
});

jsex.entity.template('Player', function(tile){
    this.decorate('Actor', 'Player', tile, '@')    
        .with('Vision', tile.map)
        .with('Player')
        .with('Inventory')
        .with('Equipment');
});

jsex.entity.template('NPC', function(name, tile, char){
    this.decorate('Actor', name, tile, char)
        .with('BasicVision')
        .with('RandomWalk');
});

jsex.entity.template('Item', function(name, tile, char){
    this.named(name)
        .with('Location', tile.map, tile, char, true)
        .with('Storeable');

    tile.add(this);          
});

jsex.entity.template('Weapon', function(name, tile, char, damage){
    var attack = jsex.component.generate('Attack', damage);
    
    this.decorate('Item', name, tile, char)
        .with('Equippable', EquipLocation.Weapon, false, [attack]);
});



jsex.entity.template('Bat', function(tile){
    this.decorate('NPC', 'bat', tile, 'b');
});

jsex.entity.template('Knife', function(tile){
    this.decorate('Weapon', 'knife', tile, '|', '2d6');
});
