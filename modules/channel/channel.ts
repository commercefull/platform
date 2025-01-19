
type ChannelType = 'WEBSITE' | 'STORE' | 'SOCIAL' | 'OTHER';

export class Channel {
    constructor(private readonly name: string, private readonly type: ChannelType) {}
}