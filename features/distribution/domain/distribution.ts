import { Inventory } from "../../inventory/domain/inventory";

export class Distribution {
  constructor(
    private readonly name: string,
    private readonly inventory: Inventory,
    private readonly type: "physical" | "digital",
    private readonly address: string | null,
  ) {}
}