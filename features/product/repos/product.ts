import mongoose, { Schema, Document } from 'mongoose';

interface IProduct extends Document {
  productCode: string;
  title: string;
  imagePath: string;
  description: string;
  price: number;
  category: mongoose.Schema.Types.ObjectId;
  manufacturer?: string;
  available: boolean;
  createdAt?: Date;
}

const productSchema: Schema = new Schema<IProduct>({
  productCode: {
    type: String,
    required: true,
    unique: true,
  },
  title: {
    type: String,
    required: true,
  },
  imagePath: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
  },
  manufacturer: {
    type: String,
  },
  available: {
    type: Boolean,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

export const Product = mongoose.model<IProduct>('Product', productSchema);
