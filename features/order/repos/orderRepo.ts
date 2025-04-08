import { queryOne, query } from "../../../libs/db";
import { unixTimestamp } from "../../../libs/date";

export type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled' | 'refunded';

export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  total: number;
};

export type Order = {
  id: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  paymentMethod: string;
  paymentId?: string;
  shippingAddress: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone: string;
  };
  billingAddress?: {
    firstName: string;
    lastName: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    country: string;
    phone: string;
  };
  notes?: string;
  trackingNumber?: string;
};

type OrderCreateProps = Omit<Order, 'id' | 'createdAt' | 'updatedAt'>;

type OrderUpdateProps = Partial<Order>;

export class OrderRepo {
  async findOne(id: string): Promise<Order | null> {
    return await queryOne<Order>('SELECT * FROM "public"."order" WHERE "id" = $1', [id]);
  }

  async findByUser(userId: string): Promise<Order[] | null> {
    return await query<Order[]>('SELECT * FROM "public"."order" WHERE "userId" = $1 ORDER BY "createdAt" DESC', [userId]);
  }

  async findAll(): Promise<Order[] | null> {
    return await query<Order[]>('SELECT * FROM "public"."order" ORDER BY "createdAt" DESC');
  }

  async findByStatus(status: OrderStatus): Promise<Order[] | null> {
    return await query<Order[]>('SELECT * FROM "public"."order" WHERE "status" = $1 ORDER BY "createdAt" DESC', [status]);
  }

  async count(): Promise<number> {
    const result = await queryOne<{ count: string }>('SELECT COUNT(*) as count FROM "public"."order"');
    return result ? parseInt(result.count, 10) : 0;
  }

  async countByUser(userId: string): Promise<number> {
    const result = await queryOne<{ count: string }>('SELECT COUNT(*) as count FROM "public"."order" WHERE "userId" = $1', [userId]);
    return result ? parseInt(result.count, 10) : 0;
  }

  async countByStatus(status: OrderStatus): Promise<number> {
    const result = await queryOne<{ count: string }>('SELECT COUNT(*) as count FROM "public"."order" WHERE "status" = $1', [status]);
    return result ? parseInt(result.count, 10) : 0;
  }

  async create(props: OrderCreateProps): Promise<Order> {
    // We'll need to insert the order into the order table and the items into an order_items table
    // This would typically be done in a transaction
    const {
      userId,
      status,
      items,
      subtotal,
      tax,
      shipping,
      total,
      paymentMethod,
      paymentId,
      shippingAddress,
      billingAddress,
      notes,
      trackingNumber
    } = props;

    // Insert the order
    const orderResult = await queryOne<Order>(`
      INSERT INTO "public"."order" (
        "userId", "status", "subtotal", "tax", "shipping", "total", 
        "paymentMethod", "paymentId", "shippingAddress", "billingAddress", "notes", "trackingNumber"
      ) 
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) 
      RETURNING *
    `, [
      userId,
      status,
      subtotal,
      tax,
      shipping,
      total,
      paymentMethod,
      paymentId,
      JSON.stringify(shippingAddress),
      billingAddress ? JSON.stringify(billingAddress) : null,
      notes,
      trackingNumber
    ]);

    if (!orderResult) {
      throw new Error('Order not saved');
    }

    // Insert the order items
    if (items && items.length > 0) {
      const orderItemsValues = items.map((item, index) => {
        return `($1, $${index * 4 + 2}, $${index * 4 + 3}, $${index * 4 + 4}, $${index * 4 + 5})`;
      }).join(', ');

      const orderItemsParams = [orderResult.id];
      items.forEach(item => {
        orderItemsParams.push(item.productId, item.name, String(item.price), String(item.quantity));
      });

      await query(`
        INSERT INTO "public"."order_item" ("orderId", "productId", "name", "price", "quantity")
        VALUES ${orderItemsValues}
      `, orderItemsParams);
    }

    // Return the order with items
    orderResult.items = items;
    return orderResult;
  }

  async update(id: string, props: OrderUpdateProps): Promise<Order | null> {
    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Build the SET clause for each property
    Object.entries(props).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'createdAt' && key !== 'items') {
        if (key === 'shippingAddress' || key === 'billingAddress') {
          updates.push(`"${key}" = $${paramIndex}`);
          values.push(JSON.stringify(value));
        } else {
          updates.push(`"${key}" = $${paramIndex}`);
          values.push(value);
        }
        paramIndex++;
      }
    });

    // Always update the updatedAt timestamp
    updates.push(`"updatedAt" = $${paramIndex}`);
    values.push(unixTimestamp());
    paramIndex++;

    // Add the ID as the last parameter
    values.push(id);

    // If there's nothing to update, return the order as is
    if (updates.length === 1) {
      return this.findOne(id);
    }

    const updateResult = await queryOne<Order>(`
      UPDATE "public"."order"
      SET ${updates.join(', ')}
      WHERE "id" = $${paramIndex}
      RETURNING *
    `, values);

    // If items need to be updated, handle them separately
    if (props.items && updateResult) {
      // First delete all existing items
      await query('DELETE FROM "public"."order_item" WHERE "orderId" = $1', [id]);

      // Then insert new items
      if (props.items.length > 0) {
        const orderItemsValues = props.items.map((item, index) => {
          return `($1, $${index * 4 + 2}, $${index * 4 + 3}, $${index * 4 + 4}, $${index * 4 + 5})`;
        }).join(', ');

        const orderItemsParams = [id];
        props.items.forEach(item => {
          orderItemsParams.push(item.productId, item.name, String(item.price), String(item.quantity));
        });

        await query(`
          INSERT INTO "public"."order_item" ("orderId", "productId", "name", "price", "quantity")
          VALUES ${orderItemsValues}
        `, orderItemsParams);
      }

      // Add items to the result
      updateResult.items = props.items;
    }

    return updateResult;
  }

  async updateStatus(id: string, status: OrderStatus): Promise<Order | null> {
    return await queryOne<Order>(`
      UPDATE "public"."order"
      SET "status" = $1, "updatedAt" = $2
      WHERE "id" = $3
      RETURNING *
    `, [status, unixTimestamp(), id]);
  }

  async delete(id: string): Promise<boolean> {
    // Delete order items first
    await query('DELETE FROM "public"."order_item" WHERE "orderId" = $1', [id]);
    
    // Then delete the order
    const result = await queryOne<{ id: string }>('DELETE FROM "public"."order" WHERE "id" = $1 RETURNING id', [id]);
    return !!result;
  }
}
