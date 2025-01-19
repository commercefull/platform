/**
 * Product attribute example: size, color, weight, etc.
 */
export class ProductAttributes {
  private readonly id: string;
  private readonly name: string;
  private readonly value: string;
  private readonly type: string;

  constructor(id: string, name: string, value: string, type: string) {
    this.id = id;
    this.name = name;
    this.value = value;
    this.type = type;
  }
}