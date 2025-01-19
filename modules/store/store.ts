import { DistributionChannel } from "./distribution-channel";

export class Store {
    private readonly distributionChannel: DistributionChannel;
    constructor(private readonly name: string, distributionChannel: DistributionChannel) {
        this.distributionChannel = distributionChannel;
    }
}
