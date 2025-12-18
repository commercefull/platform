import { Attribute } from "./attribute";

export class AttributeGroup {
    constructor(
        private readonly id: string,
        private readonly name: string,
        private readonly attributes: Attribute[],
    ) { }
}
