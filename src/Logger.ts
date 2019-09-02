import * as winston from "winston";
import {Config} from "./Config";

export const logger = winston.createLogger({
    level: Config.logLevel,
    format: winston.format.simple(),
    transports: [
        new winston.transports.Console()
    ]
});
