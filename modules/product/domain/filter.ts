import { FilterOption } from './filterOption';

export class Filter {
  constructor(
    private readonly name: string,
    private readonly options: FilterOption[],
  ) {}
}
