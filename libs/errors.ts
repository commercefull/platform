export class NotFoundError extends Error {
    statusCode
    constructor(message: string) {
        super(message);
        this.name = 'NotFoundError';
        this.statusCode = 404;
    }
}