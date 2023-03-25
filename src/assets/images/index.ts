export class Img {
  image = new Image();
  constructor(name: string) {
    this.image.src = require(`./${name}`).default;
  }
}
