const SIZE = 20;
const GAME_WRAPPER_WIDTH = 600;
const GAME_WRAPPER_HEIGHT = 300;
const GAME_WRAPPER_TOP = 150;
const GAME_WRAPPER_LEFT = 20;
var keys;
(function (keys) {
    keys[keys["RETURN"] = 13] = "RETURN";
    keys[keys["SPACE"] = 32] = "SPACE";
    keys[keys["LEFT"] = 37] = "LEFT";
    keys[keys["UP"] = 38] = "UP";
    keys[keys["RIGHT"] = 39] = "RIGHT";
    keys[keys["DOWN"] = 40] = "DOWN";
    keys[keys["C"] = 67] = "C";
    keys[keys["G"] = 71] = "G";
    keys[keys["J"] = 74] = "J";
    keys[keys["K"] = 75] = "K";
})(keys || (keys = {}));
var Utils;
(function (Utils) {
    function rand(min, max, reduce = SIZE) {
        let num = Math.floor(Math.random() * (max - min)) + min;
        return num - (num % reduce);
    }
    Utils.rand = rand;
    function snap(num, point = SIZE) {
        let bottom = num - num % point;
        let top = bottom + point;
        return num - bottom <= top - num ? bottom : top;
    }
    Utils.snap = snap;
})(Utils || (Utils = {}));
var Directions;
(function (Directions) {
    let queue = [];
    let current = keys.RIGHT;
    function set(key) {
        queue.push(key);
    }
    Directions.set = set;
    function get() {
        return current;
    }
    Directions.get = get;
    function pop() {
        if (queue.length > 0) {
            current = queue.shift();
        }
        return get();
    }
    Directions.pop = pop;
    function flush() {
        queue = [];
        current = keys.RIGHT;
    }
    Directions.flush = flush;
    function peek() {
        return queue.length > 0 ? queue[queue.length - 1] : current;
    }
    Directions.peek = peek;
})(Directions || (Directions = {}));
class Game {
    constructor() {
        this.score = 0;
        this.moving = false;
        /**
        * Snake body size
        */
        this.length = 0;
        this.gameWrapper = document.getElementById('game_wrapper');
        this.gameWrapper.style.width = `${GAME_WRAPPER_WIDTH}px`;
        this.gameWrapper.style.height = `${GAME_WRAPPER_HEIGHT}px`;
        this.gameWrapper.style.top = `${GAME_WRAPPER_TOP}px`;
        this.gameWrapper.style.left = `${GAME_WRAPPER_LEFT}px`;
        this.head = new Piece(this.gameWrapper, SIZE * 3, SIZE * 3, "head");
        this.addWalls();
        this.handleFood();
        this.setEvents();
    }
    addWalls() {
        // mur gauche
        for (var _i = 0; _i < GAME_WRAPPER_HEIGHT; _i++) {
            let mur = new Piece(this.gameWrapper, 0, _i, 'wall');
            _i = _i + SIZE - 1;
        }
        // mur droit
        for (var _i = 0; _i < GAME_WRAPPER_HEIGHT; _i++) {
            let mur = new Piece(this.gameWrapper, GAME_WRAPPER_WIDTH - SIZE, _i, 'wall');
            _i = _i + SIZE - 1;
        }
        // mur haut
        for (var _i = SIZE; _i < GAME_WRAPPER_WIDTH - SIZE; _i++) {
            let mur = new Piece(this.gameWrapper, _i, 0, 'wall');
            _i = _i + SIZE - 1;
        }
        // mur bas
        for (var _i = SIZE; _i < GAME_WRAPPER_WIDTH - SIZE; _i++) {
            let mur = new Piece(this.gameWrapper, _i, GAME_WRAPPER_HEIGHT - SIZE, 'wall');
            _i = _i + SIZE - 1;
        }
    }
    start() {
        this.showScore();
        this.moving = true;
        requestAnimationFrame(this.frame.bind(this));
    }
    showScore() {
        let el = document.querySelector(".score");
        el.innerHTML = `
            Score: ${this.score}
        `;
    }
    updateScore() {
        return this.score += 1;
    }
    /**
     * Get a random empty location for food
     */
    getFoodLocation() {
        let x = Utils.rand(GAME_WRAPPER_LEFT, GAME_WRAPPER_WIDTH, SIZE);
        let y = Utils.rand(GAME_WRAPPER_TOP, GAME_WRAPPER_HEIGHT, SIZE);
        // If random spot is already filled, pick a new one
        // Pick until you find an empty spot
        // ..... nothing can go wrong with this
        if (Locations.has(x, y)) {
            [x, y] = this.getFoodLocation();
        }
        return [x, y];
    }
    handleFood() {
        if (this.food == null) {
            let [foodX, foodY] = this.getFoodLocation();
            this.food = new Piece(this.gameWrapper, foodX, foodY, "food");
        }
        // if head and food collided, replace head with the food
        // set the correct type for each piece
        if (this.head.x === this.food.x && this.head.y === this.food.y) {
            this.food.next = this.head; // put food at the top of the chain
            this.food.direction = this.head.direction; // Needs to go to same direction where head was going
            this.head.setType("body"); // head is not body
            this.food.setType("head"); // food is now head
            this.head = this.food; // Update the Game instance with new head
            this.food = null; // food is gone now
            this.length++;
            this.updateScore(); // Calculate the new score
            this.showScore(); // Update the score
        }
    }
    /**
     * Don"t let snake to go backwards
     */
    notBackwards(key) {
        let lastDirection = Directions.peek();
        if (lastDirection === keys.UP && key === keys.DOWN
            || lastDirection === keys.DOWN && key === keys.UP
            || lastDirection === keys.LEFT && key === keys.RIGHT
            || lastDirection === keys.RIGHT && key === keys.LEFT) {
            return false;
        }
        return true;
    }
    setEvents() {
        document.addEventListener("keydown", (e) => {
            switch (e.keyCode) {
                // Arrow keys or nothing
                default:
                    if (e.keyCode in keys && this.notBackwards(e.keyCode)) {
                        Directions.set(e.keyCode);
                        e.preventDefault();
                    }
            }
        });
        document.addEventListener("click", (e) => {
            let el = e.target;
            if (el.id === "start") {
                this.start();
            }
        });
    }
    /**
     * GAME OVER
     */
    over() {
        this.moving = false;
        let el = document.querySelector(".score");
        el.innerHTML = `
      Game over!
    `;
    }
    frame() {
        if (this.moving) {
            setTimeout(() => {
                requestAnimationFrame(this.frame.bind(this));
            }, this.getSpeed());
        }
        // If head hits an occupied space, GAME OVER
        if (Locations.has(this.head.x, this.head.y)) {
            return this.over();
        }
        // If Game is not over, then move the snake to requested direction
        let direction = Directions.pop();
        if (direction === keys.RIGHT) {
            this.head.move(this.head.x + SIZE, this.head.y, keys[direction]);
        }
        if (direction === keys.LEFT) {
            this.head.move(this.head.x - SIZE, this.head.y, keys[direction]);
        }
        if (direction === keys.DOWN) {
            this.head.move(this.head.x, this.head.y + SIZE, keys[direction]);
        }
        if (direction === keys.UP) {
            this.head.move(this.head.x, this.head.y - SIZE, keys[direction]);
        }
        // Check if we caught caught the food
        // or we need to place a new food
        this.handleFood();
    }
    getSpeed() {
        return 150;
    }
}
var Locations;
(function (Locations) {
    let data = {};
    function set(x, y) {
        data[`${x}:${y}`] = true;
    }
    Locations.set = set;
    function remove(x, y) {
        delete data[`${x}:${y}`];
    }
    Locations.remove = remove;
    function has(x, y) {
        return data[`${x}:${y}`] === true;
    }
    Locations.has = has;
})(Locations || (Locations = {}));
class Piece {
    constructor(gameWrapper, x, y, type = "body", direction = "RIGHT") {
        this.gameWrapper = gameWrapper;
        this.x = x;
        this.y = y;
        this.type = type;
        this.direction = direction;
        this.next = null;
        this.el = document.createElement('div');
        this.setType(type);
        this.setPos(this.x, this.y);
        gameWrapper.appendChild(this.el);
    }
    setType(type) {
        this.type = type;
        this.applyClass();
    }
    applyClass() {
        this.el.className = "";
        this.el.classList.add("cell", this.type, this.direction);
    }
    setPos(x, y) {
        // CSS nove the element
        this.el.style.top = `${y}px`;
        this.el.style.left = `${x}px`;
        // this.el.style.transform = `translate(${x}px, ${y}px)`;
        // reset CSS classnames basically
        this.applyClass();
        // Save the location of this piece to occupied spaces
        // But don"t do this, if we are the food or head because;
        // - Head cannot collide with itself
        // - We want to collide with food :)
        if (this.type !== "head" && this.type !== "food") {
            Locations.set(x, y);
        }
    }
    move(x, y, direction = "RIGHT") {
        this.direction = direction;
        // Move HTML Element to new spot
        this.setPos(x, y);
        // Save the old direction
        let tdirection = this.direction;
        // Set new direction of the piece
        this.direction = direction;
        // If there is a next piece move it to old position
        if (this.next !== null) {
            // If this piece is a head piece, immediate piece should receive heads current
            // direction instead of old one this is needed to have a fluid motion
            this.next.move(this.x, this.y, this.type === "head" ? this.direction : tdirection);
        }
        else {
            // We are the last piece, previous position
            // is now empty, clear it
            Locations.remove(this.x, this.y);
        }
        // if I"m part of body and no one is following me
        // then I must be the tail
        if (this.next === null && this.type === "body") {
            this.el.classList.add("tail");
        }
        // if me and the piece following me are at the same spot
        // then piece following me must be the food we just swallowed
        if (this.next !== null && this.next.x === x && this.next.y === y) {
            this.next.el.classList.add("gulp");
        }
        // store new values
        this.x = x;
        this.y = y;
    }
}
let g = new Game();
