import { OrderHistory } from "./order-history";
import { Segment } from "./segment";

export class Customer {
    private readonly segment?: Segment;
    private readonly orderHistory?: OrderHistory;
    constructor(private readonly name: string) {}
}