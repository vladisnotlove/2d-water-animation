import {isObject} from './commonTypeGuards';
import {TVector} from '../core/Vector';

export function isVector<T>(value: T | TVector): value is TVector {
  return isObject(value) &&
    Number.isFinite(value['x']) &&
    Number.isFinite(value['y']);
}

export function vectorFromPoints(pointA: TVector, pointB: TVector) {
  return {
    x: pointB.x - pointA.x,
    y: pointB.y - pointA.y,
  };
}

export function normalizeVector(vector: TVector) {
  const length = Math.sqrt(vector.x * vector.x + vector.y * vector.y);
  vector.x /= length;
  vector.y /= length;
  return vector;
}

export function getVectorLength(vector: TVector) {
  return Math.sqrt(vector.x * vector.x + vector.y * vector.y);
}

export function addVectors(...args: TVector[]) {
  const sum = {x: 0, y: 0};
  args.forEach((vector) => {
    sum.x += vector.x;
    sum.y += vector.y;
  });
  return sum;
}

export function multiplyVector(vector: TVector, coeff: number) {
  return {
    x: vector.x * coeff,
    y: vector.y * coeff,
  };
}
