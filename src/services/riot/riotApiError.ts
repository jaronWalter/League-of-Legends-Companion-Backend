export class RiotApiError extends Error {
    constructor(
        public status: number,
        message: string
    ) {
        super(message);
        this.name = "RiotApiError";
    }
}