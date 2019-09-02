import {BehaviorSubject, forkJoin, Observable, of, ReplaySubject, timer} from "rxjs";
import {logger} from "../Logger";
import {filter, map, take} from "rxjs/operators";

class Bucket {
    private readonly name: string;
    private readonly rateLimitTime: number;
    private tokens: number;
    private bucketQueue: ReplaySubject<void>[] = [];

    constructor(name: string, rateLimitCount: number, rateLimitTime: number) {
        this.name = name;
        this.rateLimitTime = rateLimitTime * 1000;
        this.tokens = rateLimitCount;
        logger.info(
            `Creating bucket with sliding window time ${this.rateLimitTime}ms and #allowed tokens = ${this.tokens}`);
    }

    getBucketAvailability(): Observable<void> {
        if (this.tokens > 0) {
            this.consumeToken();
            timer(this.rateLimitTime).subscribe(() => this.renewToken());
            return of(null);
        } else {
            const waitForAvailability = new ReplaySubject<void>(1);
            this.bucketQueue.push(waitForAvailability);
            return waitForAvailability.asObservable();
        }
    }

    private consumeToken() {
        this.tokens--;
        logger.silly(`Bucket ${this.name} has ${this.tokens} tokens remaining`);
    }

    private renewToken() {
        this.tokens++;
        logger.silly(`Bucket ${this.name} has renewed a token and now has ${this.tokens} tokens remaining`);
        const nextInQueue = this.bucketQueue.shift();
        if (nextInQueue != undefined) {
            this.consumeToken();
            timer(this.rateLimitTime).subscribe(() => this.renewToken());
            nextInQueue.next();
            nextInQueue.complete();
        }
    };
}

/*
 * rxjs implementation of token bucket algorithm that supports an arbitrary number
 * of independent rates a request must respect.
 * Returns an observable that emits when a request can safely be made
 */
export class RateLimiter {
    private buckets = new Map<string, Bucket>();

    addBucket(name: string, rateLimitCount: number, rateLimitTime: number,) {
        this.buckets.set(name, new Bucket(name, rateLimitCount, rateLimitTime));
    }

    getAvailability(buckets: string[]): Observable<any> {
        return forkJoin(buckets.map(bucket => this.buckets.get(bucket).getBucketAvailability()));
    }
}
