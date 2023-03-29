import { NumberE, Random } from "../../helpers/";
import {
  Bird,
  PowerIndicator,
  Arrow,
  Man,
  Bow,
  Leaf1,
  Leaf2,
  Leaf3,
  Leaf4,
  Leaf5,
  Leaf6,
  LeafAbstract as Leaf,
  TransNumber,
  Blood,
  Health,
  Text,
  Number2D,
  AimPath,
} from "..";
import { Img, Sound } from "../../assets/";

export type GameMouseEvent = { clientX: number; clientY: number };

export class Archerman {
  static WIDTH = 800;
  static HEIGHT = 480;
  static CLIF_W = Archerman.WIDTH * 0.2;
  static CLIF_H = Archerman.HEIGHT * 0.2;
  static BG = new Img("bg.jpg").image;
  static WALL = new Img("wall2.jpg").image;
  static arrowHitSound = new Sound("arrow_hit.m4a");
  static arrowReleaseSound = new Sound("arrow_release.m4a");
  static loseSound = new Sound("lose_sound.m4a");
  static winSound = new Sound("win_sound.m4a");
  static timerSound = new Sound("timer_sound.m4a");
  static headshotDialogue = new Sound("headshot_dialogue.m4a");
  static birdHitSound = new Sound("bird-hit.m4a");
  static arrowPulling = new Sound("arrow_pulling.m4a");
  static myTurnBell = new Sound("myturn.m4a");
  static headshotReact = new Sound("headshot-react.m4a");
  static bgMusic = new Sound("bg_music.m4a");

  canvas: HTMLCanvasElement;
  players: Man[] = [];
  arrows: Arrow[] = [];
  /** current player index */
  cpi = 1; // gets flipped to 0 on init call
  /** current player */
  get cp() {
    return this.players[this.cpi];
  }
  /** my player index */
  mpi: number;
  /** current arrow */
  ca: Arrow | undefined;
  /** popped arrow */
  pa: Arrow | undefined;
  bow = new Bow();
  pullStartEvent: GameMouseEvent | null = null;
  blood = new Blood(Archerman.WIDTH, Archerman.HEIGHT);

  birds = [
    new Bird(Archerman.WIDTH / 2, Archerman.HEIGHT / 2),
    new Bird(Archerman.WIDTH / 2, Archerman.HEIGHT / 2),
    new Bird(Archerman.WIDTH / 2, Archerman.HEIGHT / 2),
    new Bird(Archerman.WIDTH / 2, Archerman.HEIGHT / 2),
  ];

  airIntensity = 0;
  gravity: number;
  ctx: CanvasRenderingContext2D;
  ctx2: CanvasRenderingContext2D;
  leaves: Leaf[] = [];
  isInteractable = false;

  powerIndicator: PowerIndicator;
  /** current scale */
  cs = new TransNumber(1);
  health = new Health(Archerman.WIDTH);
  /** when window height is smaller, some top and bottom content of the frame goes out of window*/
  hiddenVOffset = 0;
  isGamePlaying = false;
  gameOverText?: Text;
  scale = 1;
  isTesting = false;
  collisionCheckOn = true;
  fx = 0;
  fy = 0;
  fw = Archerman.WIDTH;
  fh = Archerman.HEIGHT;
  private ePrev: GameMouseEvent | null = null;
  animationFrameRequest?: number;
  yourTurn: Text;

  aimPath = new AimPath();
  constructor(mpi: number) {
    this.mpi = mpi;
    this.canvas = document.createElement("canvas");
    this.ctx = this.canvas.getContext("2d", {
      colorSpace: "srgb",
      willReadFrequently: false,
    })!;
    this.ctx2 = this.canvas.getContext("2d", {
      colorSpace: "srgb",
      willReadFrequently: true,
    })!;

    this.powerIndicator = new PowerIndicator(
      this.mpi === 0 ? 10 : Archerman.WIDTH - PowerIndicator.w - 10,
      (Archerman.HEIGHT - PowerIndicator.h) / 2
    );

    this.powerIndicator.hidden = true;

    this.yourTurn = new Text(
      "IT'S YOUR TURN!",
      Archerman.WIDTH / 2,
      Archerman.HEIGHT / 2,
      50
    );

    this.yourTurn.centered = true;
    this.yourTurn.hidden = true;

    this.canvas.width = Archerman.WIDTH;
    this.canvas.height = Archerman.HEIGHT;
  
    this.addPlayers();
    this.gravity = 150;
    this.addLeaves(20);

    Archerman.timerSound.volume = 0.7;
    Archerman.bgMusic.loop = true;
    Archerman.bgMusic.volume = 0.5;

    this.updateScaling();
    window.onresize = this.updateScaling;
    this.canvas.onpointerdown = this.handlePointerDown;

  }

  addLeaves(count: number) {
    const arr = [Leaf1, Leaf2, Leaf3, Leaf4, Leaf5, Leaf6];
    for (let i = 0; i < count; i++) {
      const C = Random.item(arr);
      this.leaves.push(new C());
    }
  }

  addPlayers = () => {
    const p1 = new Man(1, 1, true);
    const p2 = new Man(1, 1, false);

    p1.setPosition(
      Archerman.CLIF_W / 2,
      Archerman.HEIGHT -
        Archerman.CLIF_H -
        (Math.max(p1.footL.getPos().y, p1.footR.getPos().y) - p1.y)
    );

    p2.setPosition(
      Archerman.WIDTH - Archerman.CLIF_W / 2,
      Archerman.HEIGHT -
        Archerman.CLIF_H -
        (Math.max(p2.footL.getPos().y, p2.footR.getPos().y) - p2.y)
    );

    p1.updateCBox();
    p2.updateCBox();

    this.players.push(p1);
    this.players.push(p2);
  };

  amIPlaying = () => {
    return this.isTesting || this.cpi === this.mpi;
  };
  
  checkEvents = (elapsedTime: number) => {
    if (this.ca?.isMoving && this.collisionCheckOn) {
      this.birds.forEach((b, i) => {
        if (
          b.isAlive &&
          this.amIPlaying() &&
          this.ca &&
          b.doesArrowHit(this.ca, this)
        ) {
          this.handleBirdHit(i);
        }
      });
    }
    // collision check
    if (
      this.collisionCheckOn &&
      this.amIPlaying() &&
      this.ca?.isMoving &&
      this.pullStartEvent == null
    ) {
      if (this.ca.isOutOfFrame(Archerman.WIDTH, Archerman.HEIGHT)) {
        this.handleArrowOutOfFrame();
        this.handleTurnChange();
      } else {
        const playerIndex = this.ca.x > Archerman.WIDTH / 2 ? 1 : 0;
        const hit = this.players[playerIndex].doesArrowHit(this.ca);
        if (hit) {
          this.onhit(
            playerIndex,
            hit,
            this.ca.angle,
            this.ca.x,
            this.ca.y,
            this.ca.vx,
            this.ca.vy
          );
          this.handlePlayerHit(playerIndex, hit);
          this.handleTurnChange();
        }
      }
    }
    if (
      this.isGamePlaying &&
      this.isInteractable &&
      this.health.timer[this.cpi] > 0
    ) {
      this.health.timer[this.cpi] -= elapsedTime;
      if (this.health.timer[this.cpi] < 10) {
        if (!Archerman.timerSound.isPlaying && this.ca && !this.ca.isMoving) {
          Archerman.timerSound.loop = true;
          Archerman.timerSound.play();
        }
        if (this.health.timer[this.cpi] < 0) {
          Archerman.timerSound.loop = false;
          Archerman.timerSound.pause();
          this.timeoutHandler(this.cpi);
        }
      }
    }
  };
  draw = (elapsedTime: number) => {
    //bg
    this.ctx.drawImage(Archerman.BG, 0, 0, Archerman.WIDTH, Archerman.HEIGHT);
    //wall
    const ptrn = this.ctx.createPattern(Archerman.WALL, "repeat");
    this.ctx.fillStyle = ptrn!;
    this.ctx.fillRect(
      0,
      Archerman.HEIGHT - Archerman.CLIF_H,
      Archerman.CLIF_W,
      Archerman.CLIF_H
    );
    this.ctx.fillRect(
      Archerman.WIDTH - Archerman.CLIF_W,
      Archerman.HEIGHT - Archerman.CLIF_H,
      Archerman.CLIF_W,
      Archerman.CLIF_H
    );

    //rendering objects
    this.players.forEach((p) => {
      p.draw(this.ctx, elapsedTime);
    });

    this.arrows.forEach((a) => a.draw(this.ctx, elapsedTime));
    this.bow.draw(this.ctx, elapsedTime);
    this.blood.draw(this.ctx, elapsedTime);
    this.health.draw(this.ctx, elapsedTime);

    this.leaves.forEach((l) => {
      if (this.isLeafOutOfFrame(l)) {
        this.setLeafDirection(l); //OPTIMIZATION SCOPE
      }
      l.draw(this.ctx, elapsedTime);
    });
    if (!this.isGamePlaying) {
      this.gameOverText?.draw(this.ctx, elapsedTime);
    }
    if (this.amIPlaying()) {
      this.powerIndicator.draw(this.ctx, elapsedTime);
      if (
        this.pullStartEvent &&
        this.ca &&
        !this.ca.isMoving &&
        !this.isPullingBack()
      )
        this.aimPath.draw(this.ctx, elapsedTime);
    }
    this.birds.forEach((b, i) => b.draw(this.ctx, elapsedTime));

    this.ctx.resetTransform();
    this.yourTurn.draw(this.ctx, elapsedTime);
  };

  flipCP() {
    if (this.cpi != null) this.health.timer[this.cpi] = -1;
    this.cpi = this.cpi === 0 ? 1 : 0;
    this.isInteractable = false;
    if (this.isGamePlaying) {
      window.setTimeout(() => {
        if (this.amIPlaying()) {
          Archerman.myTurnBell.play();
          this.yourTurn.hidden = false;
        }
        this.isInteractable = true;
      }, 1000);
    }
    if (this.isGamePlaying) this.health.timer[this.cpi] = Health.TIMER_MAX;
  }
  focusOn(x: number, y: number, targetScale: number, elapsedTime: number) {
    if (this.cs.currentVal !== targetScale) {
      if (!this.cs.isAnimating) this.cs.setVal(targetScale, 0.15);
      this.cs.tick(elapsedTime);
    }
    const w = Archerman.WIDTH / this.cs.currentVal;
    const h = Archerman.HEIGHT / this.cs.currentVal;
    this.ctx.scale(this.cs.currentVal, this.cs.currentVal);
    const translate = [
      NumberE.withLimits(x - w / 2, 0, Archerman.WIDTH - w),
      NumberE.withLimits(y - h / 2, 0, Archerman.HEIGHT - h),
      w,
      h,
    ];
    this.ctx.translate(-translate[0], -translate[1]);
    return translate;
  }
  getBirdsFlyData = () => {
    const y = this.players?.[0].neck.getPos().y;
    const leftPoint = () => new Number2D(-Bird.W / 2, y - Random.int(50, 10)),
      rightPoint = () =>
        new Number2D(Archerman.WIDTH + Bird.W / 2, y - Random.int(50, 10)),
      middlePoint = () =>
        new Number2D(
          Archerman.WIDTH / 2 + ((Math.random() - 0.5) * Archerman.WIDTH) / 3,
          y - Random.int(100, 10)
        );

    return [
      rightPoint(),
      leftPoint(),
      Random.int(45, 20),
      middlePoint(),
      leftPoint(),
      Random.int(45, 20),
      middlePoint(),
      rightPoint(),
      Random.int(45, 20),
      leftPoint(),
      rightPoint(),
      Random.int(45, 20),
    ] as any[];
  };
  getImageData = (x: number, y: number, w: number, h: number) => {
    return this.ctx2.getImageData(
      (x - this.fx) * this.cs.currentVal,
      (y - this.fy) * this.cs.currentVal,
      w,
      h
    ).data;
  };
  handleArrowOutOfFrame = () => {
    this.pa = this.arrows.pop();
    if (this.amIPlaying()) this.onoutofframe();
  };
  handleBirdHit = (index: number) => {
    Archerman.birdHitSound.play();
    // this.collisionCheckOn = false;
    if (this.ca) this.birds[index].hitArrow(this.ca);
    if (this.amIPlaying()) {
      this.onbirdhit(index);
      this.handleTurnChange();
    }
  };

  handleBirdsFly = (birdsFlyData: any[]) => {
    if (this.amIPlaying()) this.onbirdsfly(birdsFlyData);

    this.birds.forEach((b, i) => {
      if (b.isAlive) {
        b.fly(new Number2D(b.x, b.y), birdsFlyData[i * 3], 2);
      }
    });

    setTimeout(() => {
      this.birds.forEach((b, i) => {
        if (b.isAlive) {
          if (b.timeout) {
            clearTimeout(b.timeout);
            b.timeout = undefined;
          }

          b.fly(
            birdsFlyData[i * 3],
            birdsFlyData[i * 3 + 1],
            birdsFlyData[i * 3 + 2]
          );
        } else {
          if (b.timeout == null) {
            b.timeout = setTimeout(() => {
              b.fly(
                birdsFlyData[i * 3],
                birdsFlyData[i * 3 + 1],
                birdsFlyData[i * 3 + 2]
              );
              this.arrows.unshift();
            }, 100000);
          }
        }
      });
    }, 2000);
  };
  handlePlayerMove = (x: number, y: number) => {
    const cantMove =
      this.cpi === 0
        ? x < 0 || x > Archerman.CLIF_W
        : x < Archerman.WIDTH - Archerman.CLIF_W || x > Archerman.WIDTH;
    if (!cantMove) {
      this.cp.walk(x - this.cp.x);
      this.ca && this.cp.pullArrow(0, 0, this.ca); //tbd
      this.cp.updateCBox();
      if (this.amIPlaying()) this.onplayermove(x, y);
    }
  };
  handlePlayerHit = (pi: number, hit: number) => {
    if (hit === 2) {
      if (this.amIPlaying()) Archerman.headshotDialogue.play();
      else window.setTimeout(Archerman.headshotReact.play, 300);
    }
    const newHealth = Math.max(
      this.health.health[pi].val - (hit === 2 ? 480 : 160),
      0
    );
    this.health.health[pi].setVal(newHealth, 0.1);

    const player = this.players[pi];
    Archerman.arrowHitSound.play();

    const lastArrowIndex = this.arrows.length - 1;
    this.pa = this.arrows[lastArrowIndex];

    window.setTimeout(() => {
      this.pa?.opacity.setVal(0, 2, () => {
        this.arrows.splice(lastArrowIndex, 1);
      });
    }, 2000);

    const showHeadShot = pi === this.mpi && hit == 2;
    this.blood.show(
      player.shldr.getPos().x,
      player.shldr.getPos().y,
      showHeadShot
    );
    if (newHealth <= 0) {
      this.setGameOver(pi);
    }
  };
  handlePointerDown = (e: GameMouseEvent) => {
    if (
      !this.isGamePlaying ||
      !this.isInteractable ||
      !this.amIPlaying() ||
      this.ca?.isMoving
    )
      return;
    if (
      this.cp.isPointOutOfCBox(
        e.clientX / this.scale,
        (e.clientY - this.canvas.getBoundingClientRect().y) / this.scale,
        20
      )
    ) {
      this.handlePullStart({ clientX: e.clientX, clientY: e.clientY });
    } else {
      this.ePrev = e;
    }
    if (this.ca && !this.ca.isMoving && this.isInteractable) {
      window.addEventListener("pointermove", this.handlePointerMove);
    }
    window.addEventListener("pointerup", this.handlePointerUp);
  };
  handlePointerMove = (e: PointerEvent) => {
    if (this.pullStartEvent) {
      this.handlePullArrow(e);
    } else {
      if (this.ePrev) {
        const movementX = e.clientX - this.ePrev.clientX;
        this.handlePlayerMove(
          this.cp.root.getPos().x + movementX,
          this.cp.root.getPos().y
        );
      }
      this.ePrev = e;
    }
  };
  handlePointerUp = (e: PointerEvent) => {
    if (this.pullStartEvent) {
      this.handleReleaseArrow(this.pullStartEvent, e);
    }

    window.removeEventListener("pointermove", this.handlePointerMove);
    window.removeEventListener("pointerup", this.handlePointerUp);
  };
  handlePullArrow = (e: GameMouseEvent) => {
    e = { clientX: e.clientX, clientY: e.clientY };
    if (this.pullStartEvent && this.ca) {
      this.powerIndicator.value = this.cp.pullArrow(
        this.pullStartEvent.clientX - e.clientX,
        this.pullStartEvent.clientY - e.clientY,
        this.ca
      );
    }

    if (this.amIPlaying()) {
      this.onpull(e);

      if (this.ca) {
        //aim path state updates
        this.aimPath.x = this.ca.hx;
        this.aimPath.y = this.ca.hy;
        const dx = this.cp.palmR.getPos().x - this.ca.tx,
          dy = this.cp.palmR.getPos().y - this.ca.ty;
        this.aimPath.updateState(dx * 13, dy * 13, this.ca.ay);
      }
    }
  };
  handlePullStart = (e: GameMouseEvent) => {
    this.yourTurn.hidden = true;
    Archerman.arrowPulling.play();
    this.powerIndicator.hidden = false;
    this.pullStartEvent = e;
    if (this.amIPlaying()) this.onpullstart(e);
  };
  handleReleaseArrow = (se: GameMouseEvent, ee: GameMouseEvent) => {
    Archerman.timerSound.pause();
    Archerman.arrowPulling.pause();
    this.powerIndicator.value = 0;
    this.powerIndicator.hidden = true;
    se = { clientX: se.clientX, clientY: se.clientY };
    ee = { clientX: ee.clientX, clientY: ee.clientY };

    if (this.isPullingBack()) {
      this.pullStartEvent = null;
      return;
    }

    Archerman.arrowReleaseSound.play();
    this.cp.releaseArrow();
    if (this.amIPlaying() && this.ca)
      this.onrelease(se, ee, this.ca.angle, this.ca.vx, this.ca.vy);

    window.setTimeout(() => {
      this.pullStartEvent = null;
    }, 100);
    this.aimPath.copyAsPreviousPath();
  };
  handleTurnChange = (airIntensity?: number) => {
    if(!this.isGamePlaying) {
      this.arrows = [];
      this.isGamePlaying = true;
    }
    if (this.ca) this.ca.isMoving = false;
    this.setAirIntensity(airIntensity);
    if (this.amIPlaying()) this.onturn(this.airIntensity);
    this.flipCP();
    if (this.amIPlaying()) {
      this.handleBirdsFly(this.getBirdsFlyData());
    }
    this.leaves.forEach(this.setLeafDirection);
    const a = new Arrow();
    a.ay = this.gravity;
    a.ax = this.airIntensity * 16;
    this.ca = a;
    this.arrows.push(a);
    this.cp.holdBowArrow(this.bow, a);
  };
  isLeafOutOfFrame(l: Leaf) {
    if (l.hidden) return;
    if (this.airIntensity > 0) {
      return l.x > Archerman.WIDTH;
    } else if (this.airIntensity < 0) {
      return l.x < 0;
    }
  }
  isPullingBack = () => {
    if (this.ca) {
      return this.cp.palmR.getPos().x - this.ca.tx > 0
        ? !this.cp.facingRight
        : this.cp.facingRight;
    } else {
      return true;
    }
  };
  log(str: string) {}
  onbirdhit(index: number) {}
  onbirdsfly(birdsFlyData: any[]) {}
  ongameover(won: boolean) {}
  onhit(
    pi: number,
    hit: number,
    arrowAngle: number,
    arrowX: number,
    arrowY: number,
    arrowVX: number,
    arrowVY: number
  ) {}
  onoutofframe() {}
  onpull(e: GameMouseEvent) {}
  onpullstart(e: GameMouseEvent) {}
  onplayermove = (x: number, y: number) => {};

  onrelease(
    se: GameMouseEvent,
    ee: GameMouseEvent,
    arrowAngle: number,
    arrowVX: number,
    arrowVY: number
  ) {}

  onturn(airIntensity: number) {}

  play = () => {
    let prevTime: number;
    if (this.animationFrameRequest) {
      window.cancelAnimationFrame(this.animationFrameRequest);
    }
    const cb = (elapsedTime: number) => {
      if (prevTime != null) this.tick((elapsedTime - prevTime) / 1000);
      prevTime = elapsedTime;
      this.animationFrameRequest = window.requestAnimationFrame(cb);
    };
    this.animationFrameRequest = window.requestAnimationFrame(cb);
  };

  setAirIntensity = (airIntensity?: number) => {
    this.airIntensity = airIntensity ?? Random.int(-3, 3);
  };

  setGameOver = (lostPlayerIndex: number) => {
    this.health.resetTimers();
    this.isGamePlaying = false;

    this.gameOverText = new Text(
      `${this.mpi === lostPlayerIndex ? "Alas" : "Congrats"}! You ${
        this.mpi === lostPlayerIndex ? "Lost" : "Won"
      }!`,
      Archerman.WIDTH / 2,
      Archerman.HEIGHT / 2,
      50
    );

    this.gameOverText.centered = true;

    window.setTimeout(() => {
      if (this.mpi === lostPlayerIndex) {
        Archerman.loseSound.play();
      } else {
        Archerman.winSound.play();
      }
    }, 1500);

    window.setTimeout(() => {
      if (!this.isTesting) this.ongameover(this.mpi !== lostPlayerIndex);
      this.stop();
      if (this.isTesting) this.play();
    }, 4000);
  };

  setSFXMute = (mute: boolean) => {
    [
      Archerman.arrowHitSound,
      Archerman.arrowReleaseSound,
      Archerman.loseSound,
      Archerman.winSound,
      Archerman.timerSound,
      Archerman.headshotDialogue,
      Archerman.arrowPulling,
      Archerman.myTurnBell,
      Archerman.birdHitSound,
      Archerman.headshotReact,
    ].forEach((a) => {
      if (mute) {
        a.mute();
      } else {
        a.unmute();
      }
    });
  };

  setLeafDirection = (l: Leaf) => {
    l.setAir(
      this.airIntensity * 75 + (Math.random() - 0.5) * 25,
      (Math.random() - 0.5) * 50
    );
    l.scale = Math.random() + 0.25;
    l.isMoving = true;
    l.hidden = false;
    if (this.airIntensity > 0) {
      l.x = -Random.int(Archerman.WIDTH);
    } else if (this.airIntensity < 0) {
      l.x = Archerman.WIDTH + Random.int(Archerman.WIDTH);
    }
    if (this.airIntensity !== 0) {
      l.y = Random.int(Archerman.HEIGHT);
    } else l.hidden = true;
  };

  setMusicMute = (mute: boolean) => {
    if (mute) {
      Archerman.bgMusic.mute();
    } else {
      Archerman.bgMusic.unmute();
      if (this.isGamePlaying) {
        Archerman.bgMusic.play();
      }
    }
  };

  start = () => {
    this.health.resetHealth();
    this.health.timer[this.cpi] = Health.TIMER_MAX;

    Archerman.bgMusic.play();
    if (this.amIPlaying()) {
      this.handleTurnChange();
    }
    window.setTimeout(() => {
      this.isInteractable = true;
      if (this.amIPlaying()) this.yourTurn.hidden = false;
    }, 2000);

    this.play();
  };

  stop = () => {
    this.canvas.removeEventListener("pointerdown", this.handlePointerDown);
    this.canvas.remove();

    if (this.animationFrameRequest) {
      window.cancelAnimationFrame(this.animationFrameRequest);
      this.animationFrameRequest = undefined
    }
    for (let v of Object.values(Archerman)) {
      if (v instanceof Sound) {
        v.pause();
      }
    }
  };

  tick = (elapsedTime: number) => {
    this.updateFocus(elapsedTime);
    this.draw(elapsedTime);
    this.checkEvents(elapsedTime);
  };

  timeoutHandler = (pi: number) => {
    if (this.amIPlaying() && this.ca) {
      this.onhit(
        pi,
        1,
        this.ca.angle,
        this.ca.x,
        this.ca.y,
        this.ca.vx,
        this.ca.vy
      );
      this.handlePlayerHit(pi, 1);
      this.handleTurnChange();
    }
  };

  updateFocus = (elapsedTime: number) => {
    // update focus
    // if (this.cs.val !== 1)
    let [x, y, w, h] = [0, 0, Archerman.WIDTH, Archerman.HEIGHT]; //
    this.ctx.resetTransform();
    if (this.pullStartEvent && this.ca && !this.ca.isMoving) {
      [x, y, w, h] = this.focusOn(this.cp.x, this.cp.y, 2, elapsedTime);
    } else if (this.ca && this.ca.isMoving) {
      [x, y, w, h] = this.focusOn(this.ca.x, this.ca.y, 2, elapsedTime);
    } else if (this.cs.currentVal !== 1 && this.pa != null) {
      [x, y, w, h] = this.focusOn(this.pa.x, this.pa.y, 1, elapsedTime);
    }
    this.fx = x;
    this.fy = y;
    this.fw = w;
    this.fh = h;
  };

  updateScaling = () => {
    this.scale = innerWidth / this.canvas.width;
    this.canvas.style.scale = `${this.scale}`;
    this.hiddenVOffset = Math.max(
      0,
      (Archerman.HEIGHT - innerHeight / this.scale) / 2
    );
    this.health.y = this.hiddenVOffset;
  };
}
