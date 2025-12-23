/**
 * GetPointsHistory Use Case
 *
 * Retrieves the points transaction history for a customer.
 */

export interface GetPointsHistoryInput {
  customerId: string;
  page?: number;
  limit?: number;
  type?: 'earned' | 'redeemed' | 'expired' | 'adjusted';
  startDate?: Date;
  endDate?: Date;
}

export interface PointsTransaction {
  transactionId: string;
  type: 'earned' | 'redeemed' | 'expired' | 'adjusted';
  points: number;
  balance: number;
  description: string;
  referenceType?: string;
  referenceId?: string;
  createdAt: string;
  expiresAt?: string;
}

export interface GetPointsHistoryOutput {
  transactions: PointsTransaction[];
  total: number;
  page: number;
  limit: number;
  summary: {
    totalEarned: number;
    totalRedeemed: number;
    totalExpired: number;
    currentBalance: number;
  };
}

export class GetPointsHistoryUseCase {
  constructor(private readonly loyaltyRepository: any) {}

  async execute(input: GetPointsHistoryInput): Promise<GetPointsHistoryOutput> {
    const { customerId, page = 1, limit = 20, type, startDate, endDate } = input;

    const filters: Record<string, unknown> = { customerId };
    if (type) filters.type = type;
    if (startDate) filters.startDate = startDate;
    if (endDate) filters.endDate = endDate;

    const [transactions, total, summary] = await Promise.all([
      this.loyaltyRepository.getTransactions(filters, { page, limit }),
      this.loyaltyRepository.countTransactions(filters),
      this.loyaltyRepository.getPointsSummary(customerId),
    ]);

    return {
      transactions: transactions.map((t: any) => ({
        transactionId: t.transactionId,
        type: t.type,
        points: t.points,
        balance: t.balance,
        description: t.description,
        referenceType: t.referenceType,
        referenceId: t.referenceId,
        createdAt: t.createdAt.toISOString(),
        expiresAt: t.expiresAt?.toISOString(),
      })),
      total,
      page,
      limit,
      summary,
    };
  }
}
