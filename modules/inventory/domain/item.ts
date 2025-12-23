import { Variant } from '../../product/domain/variant';

export class Item {
  constructor(
    private readonly id: string,
    private readonly name: string,
    private readonly size: number,
    private readonly quantity: number,
    private readonly variant: Variant,
  ) {}
}
