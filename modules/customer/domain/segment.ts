export class Segment {
  constructor(
    public id: string,
    public name: string,
    public description: string,
    public criteria: string,
    public createdAt?: Date,
  ) {}
}
