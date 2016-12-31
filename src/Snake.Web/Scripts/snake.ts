/**
 * Size of elements on the map
 */
const SIZE = 20;

/**
 * Width of the map
 */
const GAME_WRAPPER_WIDTH = 600;

/**
 * Height of the map
 */
const GAME_WRAPPER_HEIGHT = 300;

/**
 * Top margin of the map
 */
const GAME_WRAPPER_TOP = 150;

/**
 * Left margin of the map
 */
const GAME_WRAPPER_LEFT = 20;

/**
* List of keyboard keys the game handle
*/
enum keys {
    RETURN = 13,
    SPACE = 32,
    LEFT = 37,
    UP = 38,
    RIGHT = 39,
    DOWN = 40,
    C = 67,
    G = 71,
    J = 74,
    K = 75
}

/**
 * Utility methods to help dealing with some stuff
 */
namespace Utils {

    /**
     * Get a random number
     * @param min
     * @param max
     * @param reduce
     */
    export function rand(min: number, max: number, reduce: number = SIZE): number {
        let num = Math.floor(Math.random() * (max - min)) + min;
        return num - (num % reduce);
    }

    export function snap(num: number, point = SIZE): number {
        let bottom = num - num % point;
        let top = bottom + point;

        return num - bottom <= top - num ? bottom : top;
    }

}

namespace Directions {
    let queue: number[] = [];
    let current: number = keys.RIGHT;

    export function set(key: number): void {
        queue.push(key);
    }

    export function get(): number {
        return current;
    }

    export function pop(): number {
        if (queue.length > 0) {
            current = queue.shift();
        }
        return get();
    }

    export function flush(): void {
        queue = [];
        current = keys.RIGHT;
    }

    export function peek(): number {
        return queue.length > 0 ? queue[queue.length - 1] : current;
    }
}

/**
 * Game
 */
class Game {

    /**
    * Map
    */
    public gameWrapper: HTMLDivElement;

    /**
    * User score
    */
    public score: number = 0;

    /**
    * The food the snake have to eat
    */
    public food: Piece;

    /**
    * Snake's head
    */
    public head: Piece;

    /**
    * Snake is moving
    */
    private moving: boolean = false;

    /**
    * Snake body size
    */
    public length: number = 0;

    /**
     * New instance of the game
     */
    constructor() {

        // Build the map
        this.gameWrapper = document.getElementById('game_wrapper') as HTMLDivElement;
        this.gameWrapper.style.width = `${GAME_WRAPPER_WIDTH}px`;
        this.gameWrapper.style.height = `${GAME_WRAPPER_HEIGHT}px`;
        this.gameWrapper.style.top = `${GAME_WRAPPER_TOP}px`;
        this.gameWrapper.style.left = `${GAME_WRAPPER_LEFT}px`;

        // Create the snake
        this.head = new Piece(this.gameWrapper, SIZE * 3, SIZE * 3, "head");

        // Create map's walls
        this.addWalls();

        // Create a food to feed the snake with
        this.handleFood();

        // Events the game handles
        this.setEvents();

    }

    /**
     * Add the walls the snake can't hurt
     */
    addWalls(): void {
        // left
        for (var _i = 0; _i < GAME_WRAPPER_HEIGHT; _i++) {
            let mur: Piece = new Piece(this.gameWrapper, 0, _i, 'wall');
            _i = _i + SIZE - 1;
        }
        // right
        for (var _i = 0; _i < GAME_WRAPPER_HEIGHT; _i++) {
            let mur: Piece = new Piece(this.gameWrapper, GAME_WRAPPER_WIDTH - SIZE, _i, 'wall');
            _i = _i + SIZE - 1;
        }
        // top
        for (var _i = SIZE; _i < GAME_WRAPPER_WIDTH - SIZE; _i++) {
            let mur: Piece = new Piece(this.gameWrapper, _i, 0, 'wall');
            _i = _i + SIZE - 1;
        }
        // bottom
        for (var _i = SIZE; _i < GAME_WRAPPER_WIDTH - SIZE; _i++) {
            let mur: Piece = new Piece(this.gameWrapper, _i, GAME_WRAPPER_HEIGHT - SIZE, 'wall');
            _i = _i + SIZE - 1;
        }
    }

    /**
     * Start a game
     */
    start(): void {
        this.showScore();
        this.moving = true;
        requestAnimationFrame(this.frame.bind(this));
    }

    /**
     * Display the user score
     */
    showScore(): void {
        let el = <HTMLDivElement>document.querySelector(".score");
        el.innerHTML = `
            Score: ${this.score}
        `;
    }

    /**
     * Calculate the score
     */
    updateScore(): number {
        return this.score += 1;
    }

    /**
     * Get a random empty location for food
     */
    getFoodLocation(): number[] {
        // Generate random x and y positions
        let x = Utils.rand(GAME_WRAPPER_LEFT, GAME_WRAPPER_WIDTH, SIZE);
        let y = Utils.rand(GAME_WRAPPER_TOP, GAME_WRAPPER_HEIGHT, SIZE);

        // If random spot is already filled, pick a new one to avoid conflicts
        if (Locations.has(x, y)) {
            [x, y] = this.getFoodLocation();
        }

        return [x, y];
    }

    /**
     * Handle food => Create a new one if there is no food on the map, and manage snake/food collision
     */
    handleFood(): void {

        // If no food on the map, create a new one, snake have to eat !
        if (this.food == null) {
            let [foodX, foodY] = this.getFoodLocation();
            this.food = new Piece(this.gameWrapper, foodX, foodY, "food");
        }

        // Manage a collision between the snake and a food item
        if (this.head.x === this.food.x && this.head.y === this.food.y) {
            this.food.next = this.head;
            this.food.direction = this.head.direction;
            this.head.setType("body");
            this.food.setType("head");
            this.head = this.food;
            this.food = null;

            // Grow up the size of the snake
            this.length++;

            // Update and display new score
            this.updateScore();
            this.showScore();
        }
    }

    /**
     * Manage the thing that the snake can't move backward
     * @param key
     */
    notBackwards(key: number): boolean {
        let lastDirection = Directions.peek();

        if (lastDirection === keys.UP && key === keys.DOWN
            || lastDirection === keys.DOWN && key === keys.UP
            || lastDirection === keys.LEFT && key === keys.RIGHT
            || lastDirection === keys.RIGHT && key === keys.LEFT) {
            return false;
        }
        return true;
    }

    /**
     * Set events the game handles
     */
    setEvents(): void {

        document.addEventListener("keydown", (e: KeyboardEvent) => {
            switch (e.keyCode) {
                default:
                    if (e.keyCode in keys && this.notBackwards(e.keyCode)) {
                        Directions.set(e.keyCode);
                        e.preventDefault();
                    }
            }
        });

        /**
        * User clicked on the start game button
        */
        document.addEventListener("click", (e: MouseEvent) => {
            let el = <HTMLElement>e.target;
            if (el.id === "start") {
                this.start();
            }
        });
    }

    /**
     * Game is over
     */
    over(): void {
        this.moving = false;
        let el = <HTMLDivElement>document.querySelector(".score");
        el.innerHTML = `
      Game over!
    `;
    }

    frame(): void {
        if (this.moving) {
            setTimeout(() => {
                requestAnimationFrame(this.frame.bind(this));
            }, this.getSpeed());
        }
        
        if (Locations.has(this.head.x, this.head.y)) {
            return this.over();
        }
        
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
        
        this.handleFood();
    }

    /**
     * Get the speed of the game
     */
    getSpeed(): number {
        return 150;
    }
}

/**
 * Handle item locations
 */
namespace Locations {

    /**
     * Filled location collection
     */
    let data: { [location: string]: boolean } = {};

    /**
     * Set a new location
     * @param x
     * @param y
     */
    export function set(x: number, y: number): void {
        data[`${x}:${y}`] = true;
    }

    /**
     * Remove a location
     * @param x
     * @param y
     */
    export function remove(x: number, y: number): void {
        delete data[`${x}:${y}`];
    }

    /**
     * Check if a location is filled
     * @param x
     * @param y
     */
    export function has(x: number, y: number): boolean {
        return data[`${x}:${y}`] === true;
    }
}

/**
 * Game's item
 */
class Piece {
    el: HTMLDivElement;
    next: Piece;

    constructor(
        public gameWrapper: HTMLDivElement,
        public x: number,
        public y: number,
        public type: string = "body",
        public direction: string = "RIGHT") {
        this.next = null;
        this.el = document.createElement('div');
        this.setType(type);
        this.setPos(this.x, this.y);
        gameWrapper.appendChild(this.el);
    }

    setType(type: string): void {
        this.type = type;
        this.applyClass();
    }

    applyClass(): void {
        this.el.className = "";
        this.el.classList.add("cell", this.type, this.direction);
    }

    setPos(x: number, y: number): void {
        this.el.style.top = `${y}px`;
        this.el.style.left = `${x}px`;
        
        this.applyClass();
        
        if (this.type !== "head" && this.type !== "food") {
            Locations.set(x, y);
        }
    }

    move(x: number, y: number, direction: string = "RIGHT"): void {
        this.direction = direction;

        this.setPos(x, y);
        
        let tdirection = this.direction;
        this.direction = direction;
        if (this.next !== null) {
            this.next.move(this.x, this.y, this.type === "head" ? this.direction : tdirection);
        } else {
            Locations.remove(this.x, this.y);
        }
        
        if (this.next === null && this.type === "body") {
            this.el.classList.add("tail");
        }
        
        if (this.next !== null && this.next.x === x && this.next.y === y) {
            this.next.el.classList.add("gulp");
        }
        
        this.x = x;
        this.y = y;
    }
}

/**
 * Instanciate a new game
 */
let g = new Game();