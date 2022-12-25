# water-animation-2d

Library for adding simple 2d water animation by a canvas

<img src="https://drive.google.com/uc?export=view&id=1OymyLfbJfDvWJoJjXwOTxC6Wy31ITlS_">

## Install

```console
npm i water-animation-2d
```

## How to use

1. Add canvas on html

```html
<DOCTYPE html />
<html>
    ...
    <canvas id="canvas" width="200px" height="200px">
    </canvas>
    ...
</html>
```

2. Create waterAnimation2d

```js
const canvas = document.getElementById("canvas");
const waterAnim = new WaterAnimation2d(canvas);
```

3. Run animation

```js
waterAnim.run();
```

4. Apply force

```js
const canvasRect = canvas.getBoundingClientRect();

// applying force downward into the center
const forceId = waterAnim.applyForce(canvasRect.width * 0.5, {
  x: 0,
  y: 500
});
```

5. Cancel force

```js
setTimeout(() => {
  waterAnim.cancelForce(forceId)
}, 200)
```

## Example projects

<a href="https://github.com/vladisnotlove/water-animation-2d-example">
water-animation-2d-example
</a>

## Author

Vladislav Nikolaev, *react frontend developer*

vladisnotlove@gmail.com<br/>
<a href="https://t.me/vladisnotlove">telegram</a> |
<a href="https://gitlab.com/vladisnotlove">gitlab</a> |
<a href="https://github.com/vladisnotlove">github</a>
