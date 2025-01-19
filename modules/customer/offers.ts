export class Offers {
    private offers: string[] = [];

    add(offer: string) {
        this.offers.push(offer);
    }

    getOffers() {
        return this.offers;
    }
}