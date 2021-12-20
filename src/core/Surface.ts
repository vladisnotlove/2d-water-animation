import {
  addVectors, getVectorLength,
  isVector,
  multiplyVector,
  normalizeVector, vectorFromPoints,
} from '../utils/vectorUtils';
import {TVector} from './Vector';


type TSurfacePoint = TVector & {
  forceNext: TVector,
  forcePrev: TVector,
  externalForce: TVector,
  velocity: TVector,
}

export class Surface {
  _points: TSurfacePoint[] = [];
  _width: number;
  _spaceBetween: number;
  _tension = 700;
  _density = 3;
  _toughness = 0.2;
  _activity = 0.986;
  _minSpaceBetween = 0.9;
  
  constructor(
      width: number,
      tension = 0.5,
      density = 10,
      toughness = 0.1,
      activity = 0.986,
      minSpaceBetween = 0.9,
  ) {
    this._width = width;
    this._tension = tension;
    this._density = density;
    this._toughness = toughness;
    this._activity = activity;
    this._minSpaceBetween = minSpaceBetween;
    
    // create points
    const pointsNum = Math.round(width / 100 * this._density);
    this._spaceBetween = width / pointsNum;
    
    // set force points
    this._points = Array.from({length: pointsNum}, (_, id) => {
      return {
        x: id * this._spaceBetween,
        y: 0,
        forceNext: {x: this._tension, y: 0},
        forcePrev: {x: -this._tension, y: 0},
        externalForce: {x: 0, y: 0},
        velocity: {x: 0, y: 0},
      };
    });
    this._points.push({
      x: this._width,
      y: 0,
      forceNext: {x: this._tension, y: 0},
      forcePrev: {x: -this._tension, y: 0},
      externalForce: {x: 0, y: 0},
      velocity: {x: 0, y: 0},
    });
  }
  
  get points() {
    return this._points;
  }
  
  applyForce(x: number, force: TVector) {
    if (x >= 0 && x <= this._width && isVector(force)) {
      const index = this._points.findIndex((point) => {
        return Math.abs(point.x - x) < this._spaceBetween;
      });
      if (index) {
        this._points[index].externalForce.x = force.x;
        this._points[index].externalForce.y = force.y;
      }
      return index;
    }
  }
  
  cancelForce(id: number) {
    if (id >= 0 && id < this._points.length) {
      this._points[id].externalForce.x = 0;
      this._points[id].externalForce.y = 0;
    }
  }
  
  isUnderSurface(x: number, y: number) {
    const point = this._points.find((point) => {
      return Math.abs(point.x - x) < this._spaceBetween;
    });
    return point && point.y >= y;
  }
  
  update(deltaTime: number) {
    const pointsLength = this._points.length;
    
    // update tension forces
    for (let i = 0; i < pointsLength; i++) {
      if (i != 0) {
        const forcePrevDirection = normalizeVector(vectorFromPoints(
            this._points[i],
            this._points[i-1],
        ));
        this._points[i].forcePrev = multiplyVector(forcePrevDirection, this._tension);
      }
      if (i != pointsLength-1) {
        const forceNextDirection = normalizeVector(vectorFromPoints(
            this._points[i],
            this._points[i+1],
        ));
        this._points[i].forceNext = multiplyVector(forceNextDirection, this._tension);
      }
    }
    
    // update velocity and position
    for (let i = 0; i < pointsLength; i++) {
      const prevPoint = this._points[i-1];
      const curPoint = this._points[i];
      const nextPoint = this._points[i+1];
      
      const totalForce = addVectors(
          curPoint.forceNext,
          curPoint.forcePrev,
          curPoint.externalForce,
      );
      const deltaVelocity = multiplyVector(totalForce, 1 / this._toughness * deltaTime);
      
      // update velocity
      if (i != 0 && i != pointsLength-1) curPoint.velocity.x += deltaVelocity.x;
      curPoint.velocity.y += deltaVelocity.y;
      
      // update position
      if (i != 0 && i != pointsLength-1) {
        const newX = curPoint.x + curPoint.velocity.x * deltaTime;
        if (
          newX < nextPoint.x - this._spaceBetween * this._minSpaceBetween &&
          newX > prevPoint.x + this._spaceBetween * this._minSpaceBetween
        ) curPoint.x = newX;
      }
      curPoint.y += curPoint.velocity.y * deltaTime;
      
      // decrease velocity depending on activity
      curPoint.velocity.x *= this._activity;
      curPoint.velocity.y *= this._activity;
      
      // zero velocity if it's small enough
      if (getVectorLength(curPoint.velocity) < 0.01) {
        curPoint.velocity.x = 0;
        curPoint.velocity.y = 0;
      }
    }
    
    // balance y
    const sumY = this._points.reduce((sum, point) => sum + point.y, 0);
    const averageY = sumY / this._points.length;
    
    this._points.forEach((point) => {
      point.y -= averageY;
    });
  }
}
