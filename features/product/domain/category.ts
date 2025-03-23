import { Filter } from "./filter";

export class Category {
  constructor(
    private readonly id: string,
    private readonly name: string,
    private readonly description: string,
    private readonly imageUrl: string,
    private readonly parentCategoryId: string,
    private readonly order: number,
    private readonly filters: Filter[],
  ) {}
}