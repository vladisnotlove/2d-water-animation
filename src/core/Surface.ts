import {
  addVectors, getVectorLength,
  isVector,
  multiplyVector,
  normalizeVector, vectorFromPoints,
} from 'Utils/vectorUtils';
import {TVector} from 'Core/Vector';


type TSurfacePoint = TVector & {
  forceNext: TVector,
  forcePrev: TVector,
  externalForce: TVector,
  velocity: TVector,
}

export class Surface {
  #points: TSurfacePoint[] = [];
  #width: number;
  #spaceBetween: number;
  #tension = 700;
  #density = 3;
  #toughness = 0.2;
  #activity = 0.986;
  #minSpaceBetween = 0.9;
  
  constructor(
      width: number,
      tension = 0.5,
      density = 10,
      toughness = 0.1,
      activity = 0.986,
      minSpaceBetween = 0.9,
  ) {
    this.#width = width;
    this.#tension = tension;
    this.#density = density;
    this.#toughness = toughness;
    this.#activity = activity;
    this.#minSpaceBetween = minSpaceBetween;
    
    // create points
    const pointsNum = Math.round(width / 100 * this.#density);
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
      };
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
  
  applyForce(x: number, force: TVector) {
    if (x >= 0 && x <= this.#width && isVector(force)) {
      const index = this.#points.findIndex((point) => {
        return Math.abs(point.x - x) < this.#spaceBetween;
      });
      if (index) {
        this.#points[index].externalForce.x = force.x;
        this.#points[index].externalForce.y = force.y;
      }
      return index;
    }
  }
  
  cancelForce(id: number) {
    if (id >= 0 && id < this.#points.length) {
      this.#points[id].externalForce.x = 0;
      this.#points[id].externalForce.y = 0;
    }
  }
  
  isUnderSurface(x: number, y: number) {
    const point = this.#points.find((point) => {
      return Math.abs(point.x - x) < this.#spaceBetween;
    });
    return point && point.y >= y;
  }
  
  update(deltaTime: number) {
    const pointsLength = this.#points.length;
    
    // update tension forces
    for (let i = 0; i < pointsLength; i++) {
      if (i != 0) {
        const forcePrevDirection = normalizeVector(vectorFromPoints(
            this.#points[i],
            this.#points[i-1],
        ));
        this.#points[i].forcePrev = multiplyVector(forcePrevDirection, this.#tension);
      }
      if (i != pointsLength-1) {
        const forceNextDirection = normalizeVector(vectorFromPoints(
            this.#points[i],
            this.#points[i+1],
        ));
        this.#points[i].forceNext = multiplyVector(forceNextDirection, this.#tension);
      }
    }
    
    // update velocity and position
    for (let i = 0; i < pointsLength; i++) {
      const prevPoint = this.#points[i-1];
      const curPoint = this.#points[i];
      const nextPoint = this.#points[i+1];
      
      const totalForce = addVectors(
          curPoint.forceNext,
          curPoint.forcePrev,
          curPoint.externalForce,
      );
      const deltaVelocity = multiplyVector(totalForce, 1 / this.#toughness * deltaTime);
      
      // update velocity
      if (i != 0 && i != pointsLength-1) curPoint.velocity.x += deltaVelocity.x;
      curPoint.velocity.y += deltaVelocity.y;
      
      // update position
      if (i != 0 && i != pointsLength-1) {
        const newX = curPoint.x + curPoint.velocity.x * deltaTime;
        if (
          newX < nextPoint.x - this.#spaceBetween * this.#minSpaceBetween &&
          newX > prevPoint.x + this.#spaceBetween * this.#minSpaceBetween
        ) curPoint.x = newX;
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
    const sumY = this.#points.reduce((sum, point) => sum + point.y, 0);
    const averageY = sumY / this.#points.length;
    
    this.#points.forEach((point) => {
      point.y -= averageY;
    });
  }
}
