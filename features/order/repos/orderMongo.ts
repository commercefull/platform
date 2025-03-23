import mongoose, { Document, Schema } from 'mongoose';

interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  cart: {
    totalQty: number;
    totalCost: number;
    items: {
      productId: mongoose.Types.ObjectId;
      qty: number;
      price: number;
      title: string;
      productCode: string;
    }[];
  };
  address: string;
  paymentId: string;
  createdAt: Date;
  Delivered: boolean;
}

const orderSchema: Schema = new Schema<IOrder>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  cart: {
    totalQty: {
      type: Number,
      default: 0,
      required: true,
    },
    totalCost: {
      type: Number,
      default: 0,
      required: true,
    },
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        qty: {
          type: Number,
          default: 0,
          required: true,
        },
        price: {
          type: Number,
          default: 0,
          required: true,
        },
        title: {
          type: String,
          required: true,
        },
        productCode: {
          type: String,
          required: true,
        },
      },
    ],
  },
  address: {
    type: String,
    required: true,
  },
  paymentId: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  Delivered: {
    type: Boolean,
    default: false,
  },
});

const Order = mongoose.model<IOrder>('Order', orderSchema);

export const findAllOrdersForAnUser = async (user: any) => {
  return await Order.find({ user });
}

export const createOrder = async (props: any) => {
  const order = new Order({
    user: props.user,
    cart: props.cart,
    address: props.address,
    paymentId: props.paymentId,
  });

  return await order.save();
}