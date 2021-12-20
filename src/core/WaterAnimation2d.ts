import {
  isVector,
  vectorFromPoints,
  multiplyVector,
  normalizeVector,
} from '../utils/vectorUtils';
import {isColor} from '../utils/colorUtils';
import {Surface} from './Surface';
import {TVector} from './Vector';


export class WaterAnimation2d {
    _canvas: HTMLCanvasElement;
    _ctx: CanvasRenderingContext2D;
    _surface: Surface;
    _runIntervalId: number | null;

    _upperColor = '#ffffff';
    _bottomColor = '#3366ff';
    // Permitted values:
    _deltaTime = 0.02; //  [0.01, 1] seconds
    _surfaceTension = 700; //  [1, 100 000]
    _surfaceDensity = 3; //  [1, 50] points per 100 pixels
    _surfaceToughness = 0.2; //  [0.01, 1]
    _surfaceActivity = 0.986; //  [0.01, 0.99]
    _surfaceMinSpaceBetween = 0.9; //  [0.01, 0.99]
    _surfaceSmoothness = 0.4; //  [0, 0.5]
    _beforeUpdate: () => void;
    _afterUpdate: () => void;

    constructor(canvas: HTMLCanvasElement) {
      this._canvas = canvas;
      this._ctx = canvas.getContext('2d');
      this.createSurface();
    }

    /**
     * Color of canvas upper part<br />
     * default: _3366ff
     */
    get upperColor() {
      return this._upperColor;
    }
    set upperColor(value) {
      if (isColor(value)) {
        this._upperColor = value;
      }
    }

    /**
     * Color of canvas bottom part<br />
     * default: _ffffff
     */
    get bottomColor() {
      return this._bottomColor;
    }
    set bottomColor(value) {
      if (isColor(value)) {
        this._bottomColor = value;
      }
    }

    /**
     * One tick in seconds <br />
     * [0.01, 1] <br />
     * default: 0.02
     */
    get deltaTime() {
      return this._deltaTime;
    }
    set deltaTime(value) {
      if (Number.isFinite(value)) {
        if (value < 0.01) value = 0.01;
        if (value > 1) value = 1;
        this._deltaTime = value;
      }
    }

    /**
     * Tension of surface <br />
     * [1, 100 000] <br />
     * default: 700
     */
    get surfaceTension() {
      return this._surfaceTension;
    }
    set surfaceTension(value) {
      if (Number.isFinite(value)) {
        if (value < 0) value = 0;
        if (value > 100000) value = 100000;
        this._surfaceTension = value;
        this.createSurface();
      }
    }

    /**
     * Number of points per 100 px <br />
     * [0.01, 1] <br />
     * default: 0.2
     */
    get surfaceDensity() {
      return this._surfaceDensity;
    }
    set surfaceDensity(value) {
      if (Number.isInteger(value)) {
        if (value < 1) value = 1;
        if (value > 50) value = 50;
        this._surfaceDensity = value;
        this.createSurface();
      }
    }

    /**
     * Toughness of surface <br />
     * [1,50] <br />
     * default: 3
     */
    get surfaceToughness() {
      return this._surfaceToughness;
    }
    set surfaceToughness(value) {
      if (Number.isFinite(value)) {
        if (value < 0.01) value = 0.01;
        if (value > 1) value = 1;
        this._surfaceToughness = value;
        this.createSurface();
      }
    }

    /**
     * Activity of surface <br />
     * [0.01, 0.99] <br />
     * default: 0.986
     */
    get surfaceActivity() {
      return this._surfaceActivity;
    }
    set surfaceActivity(value) {
      if (Number.isFinite(value)) {
        if (value < 0.01) value = 0.01;
        if (value > 0.99) value = 0.99;
        this._surfaceActivity = value;
        this.createSurface();
      }
    }

    /**
     * Min space between points in percent <br />
     * [0.01, 0.99] <br />
     * default: 0.9
     */
    get surfaceMinSpaceBetween() {
      return this._surfaceMinSpaceBetween;
    }
    set surfaceMinSpaceBetween(value) {
      if (Number.isFinite(value)) {
        if (value < 0.01) value = 0.01;
        if (value > 1) value = 1;
        this._surfaceMinSpaceBetween = value;
        this.createSurface();
      }
    }

    /**
     * Min space between points in percent <br />
     * [0.01, 0.99] <br />
     * default: 0.9
     */
    get surfaceSmoothness() {
      return this._surfaceSmoothness;
    }
    set surfaceSmoothness(value) {
      if (Number.isFinite(value)) {
        if (value < 0) value = 0;
        if (value > 0.5) value = 0.5;
        this._surfaceSmoothness = value;
      }
    }
    
    /**
     * Function that run before update
     */
    get beforeUpdate() {
      return this._beforeUpdate;
    }
    set beforeUpdate(value) {
      if (typeof value === 'function') {
        this._beforeUpdate = value;
      }
    }
  
    /**
     * Function that run after update
     */
    get afterUpdate() {
      return this._afterUpdate;
    }
    set afterUpdate(value) {
      if (typeof value === 'function') {
        this._afterUpdate = value;
      }
    }
    
  
    run() {
      this._runIntervalId = setInterval(() => {
        this.update();
      }, Math.round(this.deltaTime * 1000));
    }

    stop() {
      clearInterval(this._runIntervalId);
      this._runIntervalId = null;
    }

    isRun() {
      return this._runIntervalId != null;
    }

    applyForce(x: number, force: TVector) {
      if (Number.isFinite(x) && isVector(force)) {
        force.y *= -1;
        return this._surface.applyForce(x, force);
      }
    }

    cancelForce(id: number) {
      this._surface.cancelForce(id);
    }

    isUnderSurface(x: number, y: number) {
      if (Number.isFinite(x) && Number.isFinite(y)) {
        return this._surface.isUnderSurface(x, this._canvas.height * 0.5 - y);
      }
      return false;
    }

    update() {
      this.beforeUpdate();
      
      // update surface
      this._surface.update(this._deltaTime);

      // draw background
      this._ctx.fillStyle = this._upperColor;
      this._ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);

      // draw surface
      this._ctx.beginPath();
      this._ctx.moveTo(
          this._surface.points[0].x,
          this._canvas.height * 0.5 - this._surface.points[0].y,
      );
      let cp = {
        x: 0,
        y: 0,
      };
      let prevCP = {
        x: this._surface.points[1].x * this._surfaceSmoothness,
        y: this._canvas.height * 0.5 - this._surface.points[0].y,
      };

      for (let i = 1; i < this._surface.points.length-1; i++) {
        const prevPoint = this._surface.points[i-1];
        const curPoint = this._surface.points[i];
        const nextPoint = this._surface.points[i+1];

        const prevXDist = curPoint.x - prevPoint.x;
        const nextXDist = nextPoint.x - curPoint.x;
        const cpDir = normalizeVector(vectorFromPoints(
            {x: nextPoint.x, y: -nextPoint.y},
            {x: prevPoint.x, y: -prevPoint.y},
        ));

        cp = multiplyVector(cpDir, prevXDist * this._surfaceSmoothness);
        cp.x += curPoint.x;
        cp.y += this._canvas.height * 0.5 - curPoint.y;

        this._ctx.bezierCurveTo(
            prevCP.x,
            prevCP.y,
            cp.x,
            cp.y,
            curPoint.x,
            this._canvas.height * 0.5 - curPoint.y,
        );

        prevCP = multiplyVector(cpDir, -nextXDist * this._surfaceSmoothness);
        prevCP.x += curPoint.x;
        prevCP.y += this._canvas.height * 0.5 - curPoint.y;
      }

      const curPoint = this._surface.points[this._surface.points.length-1];
      const prevPoint = this._surface.points[this._surface.points.length-2];

      cp = {
        x: curPoint.x + (curPoint.x - prevPoint.x) * this._surfaceSmoothness,
        y: this._canvas.height * 0.5 - curPoint.y,
      };

      this._ctx.bezierCurveTo(
          prevCP.x,
          prevCP.y,
          cp.x,
          cp.y,
          curPoint.x,
          this._canvas.height * 0.5 - curPoint.y);

      // complete and color surface
      this._ctx.lineTo(this._canvas.width, this._canvas.height);
      this._ctx.lineTo(0, this._canvas.height);
      this._ctx.closePath();
      this._ctx.fillStyle = this._bottomColor;
      this._ctx.fill();
  
      this.afterUpdate();
    }

    createSurface() {
      this._surface = new Surface(
          this._canvas.width,
          this.surfaceTension,
          this.surfaceDensity,
          this.surfaceToughness,
          this.surfaceActivity,
          this.surfaceMinSpaceBetween,
      );
    }
}
