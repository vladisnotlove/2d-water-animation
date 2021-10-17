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
    #canvas: HTMLCanvasElement;
    #ctx: CanvasRenderingContext2D;
    #surface: Surface;
    #runIntervalId: number | null;

    #upperColor = '#ffffff';
    #bottomColor = '#3366ff';
    // Permitted values:
    #deltaTime = 0.02; //  [0.01, 1] seconds
    #surfaceTension = 700; //  [1, 100 000]
    #surfaceDensity = 3; //  [1, 50] points per 100 pixels
    #surfaceToughness = 0.2; //  [0.01, 1]
    #surfaceActivity = 0.986; //  [0.01, 0.99]
    #surfaceMinSpaceBetween = 0.9; //  [0.01, 0.99]
    #surfaceSmoothness = 0.4; //  [0, 0.5]

    constructor(canvas: HTMLCanvasElement) {
      this.#canvas = canvas;
      this.#ctx = canvas.getContext('2d');
      this.createSurface();
    }

    /**
     * Color of canvas upper part<br />
     * default: #3366ff
     */
    get upperColor() {
      return this.#upperColor;
    }
    set upperColor(value) {
      if (isColor(value)) {
        this.#upperColor = value;
      }
    }

    /**
     * Color of canvas bottom part<br />
     * default: #ffffff
     */
    get bottomColor() {
      return this.#bottomColor;
    }
    set bottomColor(value) {
      if (isColor(value)) {
        this.#bottomColor = value;
      }
    }

    /**
     * One tick in seconds <br />
     * [0.01, 1] <br />
     * default: 0.02
     */
    get deltaTime() {
      return this.#deltaTime;
    }
    set deltaTime(value) {
      if (Number.isFinite(value)) {
        if (value < 0.01) value = 0.01;
        if (value > 1) value = 1;
        this.#deltaTime = value;
      }
    }

    /**
     * Tension of surface <br />
     * [1, 100 000] <br />
     * default: 700
     */
    get surfaceTension() {
      return this.#surfaceTension;
    }
    set surfaceTension(value) {
      if (Number.isFinite(value)) {
        if (value < 0) value = 0;
        if (value > 100000) value = 100000;
        this.#surfaceTension = value;
        this.createSurface();
      }
    }

    /**
     * Number of points per 100 px <br />
     * [0.01, 1] <br />
     * default: 0.2
     */
    get surfaceDensity() {
      return this.#surfaceDensity;
    }
    set surfaceDensity(value) {
      if (Number.isInteger(value)) {
        if (value < 1) value = 1;
        if (value > 50) value = 50;
        this.#surfaceDensity = value;
        this.createSurface();
      }
    }

    /**
     * Toughness of surface <br />
     * [1,50] <br />
     * default: 3
     */
    get surfaceToughness() {
      return this.#surfaceToughness;
    }
    set surfaceToughness(value) {
      if (Number.isFinite(value)) {
        if (value < 0.01) value = 0.01;
        if (value > 1) value = 1;
        this.#surfaceToughness = value;
        this.createSurface();
      }
    }

    /**
     * Activity of surface <br />
     * [0.01, 0.99] <br />
     * default: 0.986
     */
    get surfaceActivity() {
      return this.#surfaceActivity;
    }
    set surfaceActivity(value) {
      if (Number.isFinite(value)) {
        if (value < 0.01) value = 0.01;
        if (value > 0.99) value = 0.99;
        this.#surfaceActivity = value;
        this.createSurface();
      }
    }

    /**
     * Min space between points in percent <br />
     * [0.01, 0.99] <br />
     * default: 0.9
     */
    get surfaceMinSpaceBetween() {
      return this.#surfaceMinSpaceBetween;
    }
    set surfaceMinSpaceBetween(value) {
      if (Number.isFinite(value)) {
        if (value < 0.01) value = 0.01;
        if (value > 1) value = 1;
        this.#surfaceMinSpaceBetween = value;
        this.createSurface();
      }
    }

    /**
     * Min space between points in percent <br />
     * [0.01, 0.99] <br />
     * default: 0.9
     */
    get surfaceSmoothness() {
      return this.#surfaceSmoothness;
    }
    set surfaceSmoothness(value) {
      if (Number.isFinite(value)) {
        if (value < 0) value = 0;
        if (value > 0.5) value = 0.5;
        this.#surfaceSmoothness = value;
      }
    }

    run() {
      this.#runIntervalId = setInterval(() => {
        this.update();
      }, Math.round(this.deltaTime * 1000));
    }

    stop() {
      clearInterval(this.#runIntervalId);
      this.#runIntervalId = null;
    }

    isRun() {
      return this.#runIntervalId != null;
    }

    applyForce(x: number, force: TVector) {
      if (Number.isFinite(x) && isVector(force)) {
        force.y *= -1;
        return this.#surface.applyForce(x, force);
      }
    }

    cancelForce(id: number) {
      this.#surface.cancelForce(id);
    }

    isUnderSurface(x: number, y: number) {
      if (Number.isFinite(x) && Number.isFinite(y)) {
        return this.#surface.isUnderSurface(x, this.#canvas.height * 0.5 - y);
      }
      return false;
    }

    update() {
      // update surface
      this.#surface.update(this.#deltaTime);

      // draw background
      this.#ctx.fillStyle = this.#upperColor;
      this.#ctx.fillRect(0, 0, this.#canvas.width, this.#canvas.height);

      // draw surface
      this.#ctx.beginPath();
      this.#ctx.moveTo(
          this.#surface.points[0].x,
          this.#canvas.height * 0.5 - this.#surface.points[0].y,
      );
      let cp = {
        x: 0,
        y: 0,
      };
      let prevCP = {
        x: this.#surface.points[1].x * this.#surfaceSmoothness,
        y: this.#canvas.height * 0.5 - this.#surface.points[0].y,
      };

      for (let i = 1; i < this.#surface.points.length-1; i++) {
        const prevPoint = this.#surface.points[i-1];
        const curPoint = this.#surface.points[i];
        const nextPoint = this.#surface.points[i+1];

        const prevXDist = curPoint.x - prevPoint.x;
        const nextXDist = nextPoint.x - curPoint.x;
        const cpDir = normalizeVector(vectorFromPoints(
            {x: nextPoint.x, y: -nextPoint.y},
            {x: prevPoint.x, y: -prevPoint.y},
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
            this.#canvas.height * 0.5 - curPoint.y,
        );

        prevCP = multiplyVector(cpDir, -nextXDist * this.#surfaceSmoothness);
        prevCP.x += curPoint.x;
        prevCP.y += this.#canvas.height * 0.5 - curPoint.y;
      }

      const curPoint = this.#surface.points[this.#surface.points.length-1];
      const prevPoint = this.#surface.points[this.#surface.points.length-2];

      cp = {
        x: curPoint.x + (curPoint.x - prevPoint.x) * this.#surfaceSmoothness,
        y: this.#canvas.height * 0.5 - curPoint.y,
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
          this.surfaceMinSpaceBetween,
      );
    }
}
