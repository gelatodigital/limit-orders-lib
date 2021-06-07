// see https://stackoverflow.com/a/41102306
const CAN_SET_PROTOTYPE = "setPrototypeOf" in Object;

export class SubgraphRequestError extends Error {
  public constructor() {
    super();
    this.name = this.constructor.name;
    if (CAN_SET_PROTOTYPE) Object.setPrototypeOf(this, new.target.prototype);
  }
}
