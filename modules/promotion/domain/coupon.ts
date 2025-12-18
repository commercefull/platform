// the rules for a coupon
export const coupon = {
  // the coupon code
  code: {
    // the coupon code
    type: String,
    // the coupon code is required
    required: true,
    // the coupon code must be unique
    unique: true,
    // the coupon code must be at least 6 characters
    minlength: 6,
    // the coupon code must be at most 20 characters
    maxlength: 20,
  },
  // the coupon type
  type: {
    // the coupon type
    type: String,
    // the coupon type is required
    required: true,
    // the coupon type must be one of the following values
    enum: ["percentage", "fixed"],
  },
  // the coupon value
  value: {
    // the coupon value
    type: Number,
    // the coupon value is required
    required: true,
    // the coupon value must be at least 0
    min: 0,
  },
  // the coupon expiry date
  expiryDate: {
    // the coupon expiry date
    type: Date,
    // the coupon expiry date is required
    required: true,
  },
  // the coupon usage limit
  usageLimit: {
    // the coupon usage limit
    type: Number,
    // the coupon usage limit is required                   
    required: true,
    // the coupon usage limit must be at least 1
    min: 1,
    },  
    // the coupon usage count
    usageCount: {
        // the coupon usage count
        type: Number,
        // the coupon usage count is required
        required: true,
        // the coupon usage count must be at least 0
        min: 0,
    },
    // the coupon status
    status: {
        // the coupon status
        type: String,
        // the coupon status is required
        required: true,
        // the coupon status must be one of the following values
        enum: ["active", "inactive"],
    },
    // the coupon description
    description: {
        // the coupon description
        type: String,
        // the coupon description is required
        required: true,
        // the coupon description must be at least 10 characters            
        minlength: 10,
        // the coupon description must be at most 100 characters
        maxlength: 100,
    },
    // the coupon created date
    createdDate: {
        // the coupon created date
        type: Date,
        // the coupon created date is required
        required: true,
    },
    // the coupon updated date
    updatedDate: {
        // the coupon updated date
        type: Date,
        // the coupon updated date is required
        required: true,         
    },
    // the coupon deleted date
    deletedDate: {
        // the coupon deleted date
        type: Date,
    },
    // the coupon deleted flag
    deletedFlag: {
        // the coupon deleted flag
        type: Boolean,
        // the coupon deleted flag is required
        required: true,
    },
    // the coupon created by
    createdBy: {
        // the coupon created by
        type: String,
        // the coupon created by is required
        required: true,
        // the coupon created by must be at least 5 characters
        minlength: 5,
        // the coupon created by must be at most 50 characters      
        maxlength: 50,
    },
    // the coupon updated by
    updatedBy: {
        // the coupon updated by
        type: String,
        // the coupon updated by is required
        required: true,
        // the coupon updated by must be at least 5 characters
        minlength: 5,
        // the coupon updated by must be at most 50 characters
        maxlength: 50,
    },
    // the coupon deleted by
    deletedBy: {
        // the coupon deleted by
        type: String,
        // the coupon deleted by is required
        required: true,
        // the coupon deleted by must be at least 5 characters
        minlength: 5,
        // the coupon deleted by must be at most 50 characters
        maxlength: 50,
    },
};
