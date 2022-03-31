class Animation {
  constructor(frameIdx, hold, frames) {
    this.frameIdx = frameIdx;
    this.hold = hold;
    this.frames = frames;
    this.elapsed = 0;
  }

  render(c, scale, vector) {
    this.elapsed++;
    this.frames[this.frameIdx].render(c, scale, vector);
  }

  step(onLastFrame) {
    if (this.elapsed % this.hold === 0) {
      if (++this.frameIdx === this.frames.length) {
        this.frameIdx = 0;
        onLastFrame();
      }
    }
  }
}

class EmptyAnimation extends Animation {
  constructor() { super(); }
  render() { }
  step() { }
}

class Frame {
  constructor(imageSrc, sx, sy, sWidth, sHeight) {
    this.image = new Image();
    this.image.src = imageSrc;
    this.sx = sx;
    this.sy = sy;
    this.sWidth = sWidth;
    this.sHeight = sHeight;
  }

  render(c, scale, vector) {
    c.drawImage(
      this.image,
      this.sx,
      this.sy,
      this.sWidth,
      this.sHeight,
      vector.x,
      vector.y,
      this.sWidth * scale,
      this.sHeight * scale
    );
  }
}

class TilingFrame extends Frame {
  constructor(imageSrc, sx, sy, sWidth, sHeight, canvasWidth, canvasHeight) {
    super(imageSrc, sx, sy, sWidth, sHeight);
    this.canvasWidth = canvasWidth;
    this.canvasHeight = canvasHeight;
  }

  render(c, scale, vector) {
    super.render(c, scale, vector);
    if (vector.x <= 0) {
      super.render(c, scale, new Vector(vector.x, vector.y, this.sWidth, 0).move());
    }
    if (vector.x >= this.canvasWidth) {
      super.render(c, scale, new Vector(vector.x, vector.y, -this.sWidth, 0).move());
    }
  }
}

class Vector {
  constructor(x, y, vx, vy) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
  }

  move() {
    return new Vector(this.x+this.vx, this.y+this.vy, this.vx, this.vy);
  }
}

class GravityVector extends Vector {
  constructor(...args) {
    super(...args);
    this.gravity = 0.2;
  }
  move() {
    if (this.vy <= 0) { -1*this.vy }
    return new GravityVector(this.x+this.vx, (this.y+this.vy), this.vx, this.gravity*this.vy)
  }
}

class ScrollingVector extends Vector {
  constructor(x, y, vx, vy, width, height) {
    super(x, y, vx, vy);
    this.width = width;
    this.height = height;
  }

  move() {
    const newX = (this.x + this.vx) <= -this.width && this.vx < 0 ? 0 : (this.x + this.vx);
    return new ScrollingVector(newX, this.y+this.vy, this.vx, this.vy, this.width, this.height);
  }
}

class ZeroVector extends Vector {
  constructor(x, y) {
    super(x, y, 0, 0);
  }
}

class Sprite {
  constructor(c, scale, vector, frameset) {
    this.c = c;
    this.scale = scale;
    this.vector = vector;
    this.frameset = frameset;
  }

  render(onLastFrame = (() => {})) {
    this.vector = this.vector.move();
    this.frameset.render(this.c, this.scale, this.vector);
    this.frameset.step(onLastFrame);
  }
}


class CompositeSprite extends Sprite {
  constructor(c, scale, vector, sprites) {
    super(c, scale, vector, new EmptyAnimation());
    this.sprites = sprites;
  }

  render() {
    this.sprites.forEach((sprite) => sprite.render());
  }
}

class Background extends CompositeSprite {
  static layers = [
    'img/background/Layer_0011_0.png',
    'img/background/Layer_0010_1.png',
    'img/background/Layer_0009_2.png',
    'img/background/Layer_0008_3.png', 
    'img/background/Layer_0007_Lights.png',
    'img/background/Layer_0006_4.png',
    'img/background/Layer_0005_5.png',
    'img/background/Layer_0004_Lights.png',
    'img/background/Layer_0003_6.png',
    'img/background/Layer_0002_7.png',
    'img/background/Layer_0001_8.png',
    'img/background/Layer_0000_9.png',
  ];

  constructor(c, scale, width, height) {
    super(c, scale, new ZeroVector(0, 0), Background.layers.map((imageSrc, idx) =>
        new Sprite(c, scale, new ScrollingVector(0, 0, (-0.25*idx), 0, width, height), new Animation(0, 5, [
                new TilingFrame(imageSrc, 0, 300, width, height, width, height) ]))));
  }

  handleKeydown() {
    /* ignore */
  }
}

class Character {
  constructor(initialState, states) {
    this.currentState = initialState;
    this.states = states;
  }

  setState(newState) {
    this.currentState = newState;
  }

  getCurrentState() {
    return this.states[this.currentState];
  }

  render() {
    this.getCurrentState().render();
  }

  handleKeydown(keyCode) {
    this.getCurrentState().handleKeydown(keyCode);
  }
}

class CharacterState {
  constructor(character, sprite) {
    this.character = character;
    this.sprite = sprite;
  }

  render() {
    this.sprite.render();
  }
  handleKeydown() {
    /* ignored by default */
  }
}

class JumpingState extends CharacterState {
  constructor(...args) {
    super(...args);
  }
  render() {
    this.sprite.render(() => {
      this.character.setState('running');
    });
  }
}

class RunningState extends CharacterState {
  constructor(...args) {
    super(...args);
  }
  render() {
    this.sprite.render();
  }
  handleKeydown(keyCode) {
    switch(keyCode) {
      case 32:
        this.character.setState('jumping');
        break;
      default:
        break;
    }
  }
}

class Fox extends Character {
  constructor(c, scale, initialState, vector) {
    super(initialState);
    this.states = {
      'running': new RunningState(this, new Sprite(c, scale, vector, new Animation(0, 5, [
        new Frame('img/characters/fox.png', 0, 72, 32, 32),
        new Frame('img/characters/fox.png', 32, 72, 32, 32),
        new Frame('img/characters/fox.png', 64, 72, 32, 32),
        new Frame('img/characters/fox.png', 96, 72, 32, 32),
        new Frame('img/characters/fox.png', 128, 72, 32, 32),
        new Frame('img/characters/fox.png', 160, 72, 32, 32),
        new Frame('img/characters/fox.png', 192, 72, 32, 32),
        new Frame('img/characters/fox.png', 224, 72, 32, 32),
      ]))),
      'jumping': new JumpingState(this, new Sprite(c, scale, vector, new Animation(0, 5, [
        new Frame('img/characters/fox.png', 0, 104, 32, 32),
        new Frame('img/characters/fox.png', 32, 104, 32, 32),
        new Frame('img/characters/fox.png', 64, 104, 32, 32),
        new Frame('img/characters/fox.png', 96, 104, 32, 32),
        new Frame('img/characters/fox.png', 128, 104, 32, 32),
        new Frame('img/characters/fox.png', 160, 104, 32, 32),
        new Frame('img/characters/fox.png', 192, 104, 32, 32),
        new Frame('img/characters/fox.png', 224, 104, 32, 32),
        new Frame('img/characters/fox.png', 256, 104, 32, 32),
        // new Frame('img/characters/fox.png', 288, 104, 32, 32),
        // new Frame('img/characters/fox.png', 320, 104, 32, 32),
      ]))),
    }
  }
}

class Scene {
  constructor(c, width, height) {
    this.sprites = [
      new Background(c, 1, width, height),
      new Fox(c, 3, 'running', new ZeroVector(400, 355)),
    ];

    document.addEventListener('keydown', (evt) => {
      switch (evt.keyCode) {
        case 32:
          this.sprites.forEach((sprite) => sprite.handleKeydown(evt.keyCode));
          evt.preventDefault();
          break;
        default:
          break;
      }
    });
  }

  render() {
    this.sprites.forEach((sprite) => sprite.render());
  }
}

const initializeContext = (width, height) => {
  const canvas = document.getElementById('screen');
  canvas.width = width;
  canvas.height = height;
  
  const context = canvas.getContext('2d');
  context.imageSmoothingEnabled = false;
  return context;
};

const main = () => {
  const width = 928;
  const height = 493;
  const c = initializeContext(width, height);
  const scene = new Scene(c, width, height);
  const animate = function animate() {
    window.requestAnimationFrame(animate);
    scene.render();
  }();
  document.getElementById('screen').addEventListener('click', () => {
    const audio = document.querySelector('audio');
    audio.volume = 0.05;
    audio.paused ? audio.play() : audio.pause();
  });
};

document.addEventListener('DOMContentLoaded', main);
