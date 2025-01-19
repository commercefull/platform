export class Cart {
    private items: string[] = [];

    add(item: string) {
        this.items.push(item);
    }

    getItems() {
        return this.items;
    }
}