import { Inventory } from "../../inventory/domain/inventory";

export class Distribution {
  constructor(
    private readonly name: string,
    private readonly inventory: Inventory,
    private readonly type: "physical" | "digital",
    private readonly address: string | null,
    private readonly currencyCode: string, // Currency code for this distribution channel
  ) {}
  
  public getName(): string {
    return this.name;
  }
  
  public getInventory(): Inventory {
    return this.inventory;
  }
  
  public getType(): "physical" | "digital" {
    return this.type;
  }
  
  public getAddress(): string | null {
    return this.address;
  }
  
  public getCurrencyCode(): string {
    return this.currencyCode;
  }
}