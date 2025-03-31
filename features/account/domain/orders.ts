type Order = {
    orderId: string
    user: string
    address: string
    paymentId: string
    createdAt: Date
    delivered: boolean
    items: OrderItem[]
}

type OrderItem  = {
    orderItemId: string
    productId: string
    qty: number
    price: number
    title: string
    productCode: string
}

export class Orders {
    constructor(
        private readonly orders: Order[],
    ) {}
}