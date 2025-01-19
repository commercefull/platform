export class Tax {
    constructor(private taxRate: number) {}
    
    getTax(amount: number) {
        return amount * this.taxRate;
    }
}