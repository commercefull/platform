import { Item } from './item';

export class Inventory {
  constructor(
    private readonly id: string,
    private readonly name: string,
    private readonly description: string,
    private readonly price: number,
    private readonly quantity: number,
    private readonly image: string,
    private readonly items: Item[],
  ) {}
}
