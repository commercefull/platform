import mongoose, { Document, Schema } from "mongoose";

interface ICategory extends Document {
  title: string;
  slug: string;
}

const categorySchema: Schema = new Schema<ICategory>({
  title: {
    type: String,
    required: true,
  },
  slug: {
    type: String,
    unique: true,
  },
});

export const Category = mongoose.model<ICategory>("Category", categorySchema);
