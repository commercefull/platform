export interface OrderNote {
  orderNoteId: string;
  createdAt: string;
  updatedAt: string;
  orderId: string;
  content: string;
  isCustomerVisible: boolean;
  createdBy?: string;
  deletedAt?: string;
}

export type OrderNoteCreateParams = Omit<OrderNote, 'orderNoteId' | 'createdAt' | 'updatedAt' | 'deletedAt'>;

export interface OrderNoteRepository {
  findByOrder(orderId: string): Promise<OrderNote[]>;
  create(params: OrderNoteCreateParams): Promise<OrderNote>;
  softDelete(orderNoteId: string): Promise<boolean>;
}
