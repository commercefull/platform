import mongoose, { Document, Schema } from "mongoose";

interface CartItem {
  productId: Schema.Types.ObjectId;
  qty: number;
  price: number;
  title: string;
  productCode: string;
}

interface BasketDocument extends Document {
  items: CartItem[];
  totalQty: number;
  totalCost: number;
  user?: Schema.Types.ObjectId;
  createdAt: Date;
}

const basketSchema = new Schema<BasketDocument>({
  items: [
    {
      productId: {
        type: Schema.Types.ObjectId,
        ref: "Product",
      },
      qty: {
        type: Number,
        default: 0,
      },
      price: {
        type: Number,
        default: 0,
      },
      title: {
        type: String,
      },
      productCode: {
        type: String,
      },
    },
  ],
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
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: false,
  },
  createdAt: {
    type: Schema.Types.Date,
    default: Date.now,
  },
});

export const Basket = mongoose.model("Basket", basketSchema);

export const saveUserBasket = async (sessionBasket: any, userId: Schema.Types.ObjectId) => {
  const basket = new Basket(sessionBasket);
  basket.user = userId;
  await basket.save();
}

export const findUserBasket = async (userId: Schema.Types.ObjectId) => {
  return await Basket.findOne({ user: userId });
}

export const findBasketById = async (basketId: Schema.Types.ObjectId) => {
  const basket = await Basket.findById(basketId);

  if (!basket) {
    throw new Error("Basket not found");
  }

  return basket;
}

export const findBasketByIdAndDelete = async (basketId: Schema.Types.ObjectId) => {
  return await Basket.findByIdAndDelete(basketId);
}