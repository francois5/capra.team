var WarpedSound = function(game, key, volume, loop) {
    Phaser.Sound.call(this, game, key, volume, loop);
    game.sound._sounds.push(this);
}

WarpedSound.prototype = Object.create(Phaser.Sound.prototype);

WarpedSound.prototype.constructor = WarpedSound;

WarpedSound.prototype.setSpeed = function(speed) {
    if(!!this._sound) {
	this._sound.playbackRate.value = speed;
    } else {
	this.onPlay.addOnce(function() {
	    this._sound.playbackRate.value = speed;
	}, this);
    }
}

WarpedSound.prototype.tweenSpeed = function(speed, duration) {
    function applyTween(s, d) {
	game.add.tween(this._sound.playbackRate).to({value: s}, d, Phaser.Easing.Exponential.In, true, 0, 0);
    }
    if(!!this._sound) {
	applyTween.call(this, speed, duration);
    } else {
	this.onPlay.addOnce(function() {
	    applyTween.call(this, speed, duration)
	}, this);
    }
}

WarpedSound.prototype.createFilter = function(maxHZ) {
    maxHZ = maxHZ || 440;
    function applyFilter(hz) {
	this._filter = this.context.createBiquadFilter();
	// Create the audio graph.
	this._sound.connect(this._filter);
	this._filter.connect(this.context.destination);
	// Create and specify parameters for the low-pass filter.
	this._filter.type = 0; // Low-pass filter. See BiquadFilterNode docs
	this._filter.frequency.value = hz; // Set cutoff to passed in HZ
    };

    if(!!this._sound) {
	applyFilter.call(this, maxHZ);
    } else {
	this.onPlay.addOnce(function() {
	    applyFilter.call(this, maxHZ)
	}, this);
    }
};

WarpedSound.prototype.tweenFilter = function(maxHZ, duration) {
    maxHZ = maxHZ || 100;
    duration = duration || 1000;
    function applyTween(s, d) {
	if(!this._filter) {
	    this.createFilter();
	}
	game.add.tween(this._filter.frequency).to({value: s}, d, Phaser.Easing.Linear.NONE, true);
    }
    if(!!this._sound) {
	applyTween.call(this, maxHZ, duration);
    } else {
	this.onPlay.addOnce(function() {
	    applyTween.call(this, maxHZ, duration)
	}, this);
    }
}
