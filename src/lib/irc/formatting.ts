export enum Colour {
  WHITE = 0,
  BLACK,
  BLUE,
  GREEN,
  RED,
  BROWN,
  MAGENTA,
  ORANGE,
  YELLOW,
  LIGHT_GREEN,
  CYAN,
  LIGHT_CYAN,
  LIGHT_BLUE,
  PINK,
  GREY,
  LIGHT_GREY,
  DEFAULT = 99,
}

export function colour(text: string, colourName: Colour) {
  return `\x03${colourName}${text}\x03`;
}

export function bold(text: string) {
  return `\x02${text}\x02`;
}

export function italics(text: string) {
  return `\x1D${text}\x1D`;
}

export function underline(text: string) {
  return `\x1F${text}\x1F`;
}

export function strikethrough(text: string) {
  return `\x1E${text}\x1E`;
}

export class FormattingBuilder {
  constructor(public text: string) {}

  colour(text: string, colourName: Colour) {
    this.text += colour(text, colourName);
    return this;
  }

  bold(text: string) {
    this.text += bold(text);
    return this;
  }

  italics(text: string) {
    this.text += italics(text);
    return this;
  }

  underline(text: string) {
    this.text += underline(text);
    return this;
  }

  strikethrough(text: string) {
    this.text += strikethrough(text);
    return this;
  }

  normal(text: string) {
    this.text += text;
    return this;
  }
}
