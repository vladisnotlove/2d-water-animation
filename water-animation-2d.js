"use strict"

// WATER ANIMATION (MAIN CLASS)

class WaterAnimation2d {
    #canvas;
    #ctx;
    #surface;
    #runInterval;

    #upperColor = '#ffffff';
    #bottomColor = '#9999ff';
                                        // Permitted values:
    #deltaTime = 0.02;                  //  [0.01, 1] seconds
    #surfaceTension = 700;              //  [1, 100 000]
    #surfaceDensity = 3;                //  [1, 50] points per 100 pixels
    #surfaceToughness = 0.2;            //  [0.01, 1]
    #surfaceActivity = 0.986;           //  [0.01, 0.99]
    #surfaceMinSpaceBetween = 0.9;      //  [0.01, 0.99]
    #surfaceSmoothness = 0.4;           //  [0, 0.5]

    constructor(canvas) {
        this.#canvas = canvas;
        this.#ctx = canvas.getContext('2d');
        this.createSurface();
    }

    get upperColor() {
        return this.#upperColor;
    }
    set upperColor(value) {
        if (isColor(value)) {
            this.#upperColor = value;
        }
    }

    get bottomColor() {
        return this.#bottomColor
    }
    set bottomColor(value) {
        if (isColor(value)) {
            this.#bottomColor = value;
        }
    }

    get deltaTime() {
        return this.#deltaTime
    }
    set deltaTime(value) {
        if (Number.isFinite(value)) {
            if (value < 0.01) value = 0.01;
            if (value > 1) value = 1;
            this.#deltaTime = value;
        }
    }

    get surfaceTension() {
        return this.#surfaceTension
    }
    set surfaceTension(value) {
        if (Number.isFinite(value)) {
            if (value < 0) value = 0;
            if (value > 100000) value = 100000;
            this.#surfaceTension = value;
            this.createSurface();
        }
    }

    get surfaceDensity() {
        return this.#surfaceDensity
    }
    set surfaceDensity(value) {
        if (Number.isInteger(value)) {
            if (value < 1) value = 1;
            if (value > 50) value = 50;
            this.#surfaceDensity = value;
            this.createSurface();
        }
    }

    get surfaceToughness() {
        return this.#surfaceToughness
    }
    set surfaceToughness(value) {
        if (Number.isFinite(value)) {
            if (value < 0.01) value = 0.01;
            if (value > 1) value = 1;
            this.#surfaceToughness = value;
            this.createSurface();
        }
    }

    get surfaceActivity() {
        return this.#surfaceActivity
    }
    set surfaceActivity(value) {
        if (Number.isFinite(value)) {
            if (value < 0.01) value = 0.01;
            if (value > 0.99) value = 0.99;
            this.#surfaceActivity = value;
            this.createSurface();
        }
    }

    get surfaceMinSpaceBetween() {
        return this.#surfaceMinSpaceBetween
    }
    set surfaceMinSpaceBetween(value) {
        if (Number.isFinite(value)) {
            if (value < 0.01) value = 0.01;
            if (value > 1) value = 1;
            this.#surfaceMinSpaceBetween = value;
            this.createSurface();
        }
    }

    get surfaceSmoothness() {
        return this.#surfaceSmoothness
    }
    set surfaceSmoothness(value) {
        if (Number.isFinite(value)) {
            if (value < 0) value = 0;
            if (value > 0.5) value = 0.5;
            this.#surfaceSmoothness = value;
        }
    }

    run() {
        this.#runInterval = setInterval(() => {this.update()}, Math.round(this.deltaTime * 1000));
    }

    stop() {
        clearInterval(this.#runInterval);
        this.#runInterval = null;
    }

    isRun() {
        return this.#runInterval != null;
    }

    applyForce(x, force) {
        if (Number.isFinite(x) && isVector(force)) {
            force.y *= -1;
            return this.#surface.applyForce(x, force);
        }
    }

    cancelForce(id) {
        this.#surface.cancelForce(id);
    }

    isUnderSurface(x, y) {
        if (Number.isFinite(x) && Number.isFinite(y)) {
            return this.#surface.isUnderSurface(x, this.#canvas. height * 0.5 - y);
        }
        return false;
    }

    update() {
        // update surface
        this.#surface.update(this.#deltaTime);

        //draw background
        this.#ctx.fillStyle = this.#upperColor;
        this.#ctx.fillRect(0, 0, this.#canvas.width, this.#canvas.height);

        //draw surface
        this.#ctx.beginPath();
        this.#ctx.moveTo(
            this.#surface.points[0].x,
            this.#canvas.height * 0.5 - this.#surface.points[0].y
        );
        let cp = {};
        let prevCP = {
            x: this.#surface.points[1].x * this.#surfaceSmoothness,
            y: this.#canvas.height * 0.5 - this.#surface.points[0].y
        };

        for (let i = 1; i < this.#surface.points.length-1; i++) {
            let prevPoint = this.#surface.points[i-1];
            let curPoint = this.#surface.points[i];
            let nextPoint = this.#surface.points[i+1];

            let prevXDist = curPoint.x - prevPoint.x;
            let nextXDist = nextPoint.x - curPoint.x;
            let cpDir = normalizeVector(getVector(
                {x: nextPoint.x, y: -nextPoint.y},
                {x: prevPoint.x, y: -prevPoint.y}
            ));

            cp = multiplyVector(cpDir, prevXDist * this.#surfaceSmoothness);
            cp.x += curPoint.x;
            cp.y += this.#canvas.height * 0.5 - curPoint.y;

            this.#ctx.bezierCurveTo(
                prevCP.x,
                prevCP.y,
                cp.x,
                cp.y,
                curPoint.x,
                this.#canvas.height * 0.5 - curPoint.y
            );

            prevCP = multiplyVector(cpDir, -nextXDist * this.#surfaceSmoothness);
            prevCP.x += curPoint.x;
            prevCP.y += this.#canvas.height * 0.5 - curPoint.y;
        };

        let curPoint = this.#surface.points[this.#surface.points.length-1];
        let prevPoint = this.#surface.points[this.#surface.points.length-2];

        cp = {
            x: curPoint.x + (curPoint.x - prevPoint.x) * this.#surfaceSmoothness,
            y: this.#canvas.height * 0.5 - curPoint.y
        };

        this.#ctx.bezierCurveTo(
            prevCP.x,
            prevCP.y,
            cp.x,
            cp.y,
            curPoint.x,
            this.#canvas.height * 0.5 - curPoint.y);

        // complete and color surface
        this.#ctx.lineTo(this.#canvas.width, this.#canvas.height);
        this.#ctx.lineTo(0, this.#canvas.height);
        this.#ctx.closePath();
        this.#ctx.fillStyle = this.#bottomColor;
        this.#ctx.fill();
    }

    createSurface() {
        this.#surface = new Surface(
            this.#canvas.width,
            this.surfaceTension,
            this.surfaceDensity,
            this.surfaceToughness,
            this.surfaceActivity,
            this.surfaceMinSpaceBetween
        )
    }
}


// SURFACE (SUPPORT CLASS)

class Surface {
    #points = [];
    #width;
    #spaceBetween;              // Recommended values:
    #tension = 700;             //  [1, 100 000]
    #density = 3;               //  [1, 50] points per 100 pixels
    #toughness = 0.2;           //  [0.01, 1]
    #activity = 0.986;          //  [0.01, 0.99]
    #minSpaceBetween = 0.9;     //  [0.01, 0.99]

    constructor(
        width,
        tension = 0.5,
        density = 10,
        toughness = 0.1,
        activity = 0.986,
        minSpaceBetween = 0.9
    ) {
        this.#width = width;
        this.#tension = tension;
        this.#density = density;
        this.#toughness = toughness;
        this.#activity = activity;
        this.#minSpaceBetween = minSpaceBetween;

        // create points
        let pointsNum = Math.round(width / 100 * this.#density);
        this.#spaceBetween = width / pointsNum;

        // set force points
        this.#points = Array.from({length: pointsNum}, (_, id) => {
            return {
                x: id * this.#spaceBetween,
                y: 0,
                forceNext: {x: this.#tension, y: 0},
                forcePrev: {x: -this.#tension, y: 0},
                externalForce: {x: 0, y: 0},
                velocity: {x: 0, y: 0},
            }
        });
        this.#points.push({
            x: this.#width,
            y: 0,
            forceNext: {x: this.#tension, y: 0},
            forcePrev: {x: -this.#tension, y: 0},
            externalForce: {x: 0, y: 0},
            velocity: {x: 0, y: 0},
        });
    }

    get points() {
        return this.#points;
    }

    applyForce(x, force) {
        if (x => 0 && x <= this.#width && isVector(force)) {
            let index = this.#points.findIndex(point => {
                return Math.abs(point.x - x) < this.#spaceBetween
            });
            if (index) {
                this.#points[index].externalForce.x = force.x;
                this.#points[index].externalForce.y = force.y;
            }
            return index;
        }
    }

    cancelForce(id) {
        if (id >= 0 && id < this.#points.length) {
            this.#points[id].externalForce.x = 0;
            this.#points[id].externalForce.y = 0;
        }
    }

    isUnderSurface(x, y) {
        let point = this.#points.find(point => {
            return Math.abs(point.x - x) < this.#spaceBetween
        });
        return point && point.y >= y;
    }

    update(deltaTime) {
        let pointsLength = this.#points.length;

        // update tension forces
        for (let i = 0; i < pointsLength; i++) {
            if (i != 0) {
                let forcePrevDirection = normalizeVector(getVector(this.#points[i], this.#points[i-1]));
                this.#points[i].forcePrev = multiplyVector(forcePrevDirection, this.#tension);
            }
            if (i != pointsLength-1) {
                let forceNextDirection = normalizeVector(getVector(this.#points[i], this.#points[i+1]));
                this.#points[i].forceNext = multiplyVector(forceNextDirection, this.#tension);
            }
        }

        // update velocity and position
        for (let i = 0; i < pointsLength; i++) {
            let prevPoint = this.#points[i-1];
            let curPoint = this.#points[i];
            let nextPoint = this.#points[i+1];

            let totalForce = addVectors(
                curPoint.forceNext,
                curPoint.forcePrev,
                curPoint.externalForce
            );
            let deltaVelocity = multiplyVector(totalForce, 1 / this.#toughness * deltaTime);

            // update velocity
            if (i != 0 && i != pointsLength-1) curPoint.velocity.x += deltaVelocity.x;
            curPoint.velocity.y += deltaVelocity.y;

            // update position
            if (i != 0 && i != pointsLength-1) {
                let newX = curPoint.x + curPoint.velocity.x * deltaTime;
                if (newX < nextPoint.x - this.#spaceBetween * this.#minSpaceBetween &&
                    newX > prevPoint.x + this.#spaceBetween * this.#minSpaceBetween) curPoint.x = newX;
            }
            curPoint.y += curPoint.velocity.y * deltaTime;

            // decrease velocity depending on activity
            curPoint.velocity.x *= this.#activity;
            curPoint.velocity.y *= this.#activity;

            // zero velocity if it's small enough
            if (getVectorLength(curPoint.velocity) < 0.01) {
                curPoint.velocity.x = 0;
                curPoint.velocity.y = 0;
            }
        }

        // balance y
        let averageY = this.#points.reduce((sum, point) => sum + point.y, 0) / this.#points.length;
        this.#points.forEach(point => {
            point.y -= averageY;
        })
    }
}


// UTILS

function isColor(strColor){
    let s = new Option().style;
    s.color = strColor;
    return Boolean(s.color);
}

function isVector(obj){
    return Boolean(obj) && Number.isFinite(obj.x) && Number.isFinite(obj.y);
}

function getVector(pointA, pointB) {
    return {
        x: pointB.x - pointA.x,
        y: pointB.y - pointA.y
    }
}

function normalizeVector(vector) {
    let length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
    vector.x /= length;
    vector.y /= length;
    return vector;
}

function getVectorLength(vector) {
    return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
}

function addVectors() {
    let sum = {x: 0, y: 0}
    for (let i = 0; i < arguments.length; i++) {
        sum.x += arguments[i].x;
        sum.y += arguments[i].y;
    }
    return sum;
}

function multiplyVector(vector, coeff) {
    return {
        x: vector.x * coeff,
        y: vector.y * coeff,
    }
}


export default WaterAnimation2d