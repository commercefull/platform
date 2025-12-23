export class Review {
  constructor(
    public productId: string,
    public userId: string,
    public rating: number,
    public review: string,
    public createdAt?: Date,
  ) {}
}
