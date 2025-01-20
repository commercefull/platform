type MerchantAuthRepoType = {
    email: string;
    password: string;
    merchantId: string;
    status: number;
};

export class MerchantAuthRepo {
    async findByEmail(email: string) : Promise<MerchantAuthRepoType> {
        return {
            email: '',
            password: '',
            merchantId: '',
            status: 0
        };
    }

    async updateLastLogin(merchantId: string) {
        return null;
    }
}