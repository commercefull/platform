import { Item } from "./item";

export class Inventory {
  private items: Item[] = [];

  addItem(item: Item) {
    this.items.push(item);
  }

  removeItem(item: Item) {
    this.items = this.items.filter(i => i !== item);
  }
}