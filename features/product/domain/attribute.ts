

export class ProductAttribute {
  private readonly id: string;
  private readonly name: string;
  private readonly options: string[];

  constructor(props: ProductAttribute) {
    this.id = props.id;
    this.name = props.name;
    this.options = props.options;
  }
}   
