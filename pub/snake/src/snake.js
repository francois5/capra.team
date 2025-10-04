var Snake = function(x, y) {

    var SnakeNode = function(x, y) {
	this.next = null;
	this.x = x;
	this.y = y;
    };
    
    this.head = new SnakeNode(x, y);
    this.tail = this.head;
    this.previousTail = null;
    this.hasEaten = false;

    this.grow = function() {
	this.hasEaten = true;
    }

    this.collide = function() {
	var curNode = this.tail;
	while(curNode.next != null) {
	    if(curNode.x == this.head.x && curNode.y == this.head.y)
		return true;
	    curNode = curNode.next;
	}
	return false;
    }

    this.move = function(dir) {
	if(dir != direction.STOP) {
	    var curNode = this.tail;
	    this.previousTail = new SnakeNode(this.tail.x, this.tail.y);
	    if(this.hasEaten) {
		this.tail = new SnakeNode(this.tail.x, this.tail.y);
		this.tail.next = curNode;
	    }
	    while(curNode.next != null) {
		curNode.x = curNode.next.x;
		curNode.y = curNode.next.y;
		curNode = curNode.next;
	    }
	    if(dir == direction.UP)
		curNode.y -= 1;
	    else if(dir == direction.DOWN)
		curNode.y += 1;
	    else if(dir == direction.LEFT)
		curNode.x -= 1;
	    else if(dir == direction.RIGHT)
		curNode.x += 1;
	}
    }

    this.is_on = function(x, y) {
	var curNode = this.tail;
	while(curNode != null) {
	    if(curNode.x == x && curNode.y == y)
		return true;
	    curNode = curNode.next;
	}
	return false;
    }
}
