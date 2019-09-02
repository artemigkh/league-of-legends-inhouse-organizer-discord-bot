import * as winston from "winston";

export const logger = winston.createLogger({
    level: 'silly',
    format: winston.format.simple(),
    transports: [
        new winston.transports.Console()
    ]
});
