import { Attribute } from './attribute';

export class FilterOption {
  constructor(
    private readonly name: string,
    private readonly value: string,
    private readonly attributes: Attribute[],
  ) {}
}
