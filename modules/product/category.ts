import { Product } from "./product";

export class Category {
    private readonly categoryId: string;
    private readonly name: string;
    private readonly parent: Category | undefined;
    private readonly children: Category[] = [];
    private readonly products: Product[] = [];

    constructor(categoryId: string, name: string, parent: Category | undefined) {
        this.categoryId = categoryId;
        this.name = name;
        this.parent = parent;
    }
}