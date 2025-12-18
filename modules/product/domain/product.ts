export class Product {
  constructor(
    private readonly id: string,
    private readonly name: string,
    private readonly description: string,
    private readonly imageUrl: string,
    private readonly mainVariant: number,
  ) {}
}
