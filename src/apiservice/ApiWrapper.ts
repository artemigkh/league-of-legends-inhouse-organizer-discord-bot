import {SummonerApi, TournamentApi} from "../../generated/apis";
import {
    Configuration, LobbyEventDTOWrapper,
    Middleware,
    RequestArgs, SummonerDTO,
    TournamentCodeParametersMapTypeEnum,
    TournamentCodeParametersPickTypeEnum,
    TournamentCodeParametersSpectatorTypeEnum
} from "../../generated";
import {Observable, of} from "rxjs";
import NodeCache from "node-cache";
import {logger} from "../Logger";
import {Config} from "../Config";
import {RateLimiter} from "./RateLimiter";
import {mergeMap} from "rxjs/operators";

/*
 * Middleware for adding to a header to the rxjs http request
 */
class AddHeader implements Middleware {
    private readonly headerKey: string;
    private readonly headerVal: string;

    constructor(headerKey: string, headerVal: string) {
        this.headerKey = headerKey;
        this.headerVal = headerVal;
    }

    pre(request: RequestArgs): RequestArgs {
        request.headers = request.headers || {};
        request.headers[this.headerKey] = this.headerVal;
        return request;
    }

}

/*
 * This class wraps the openapi-generator http client that interfaces with the riot api
 * while providing two additional pieces of functionality:
 *   1) Caching of summoner objects
 *   2) Rate limiting for riot api requirements with token bucket algorithm
 */
export class ApiWrapper {
    addRiotApiKey = new AddHeader('X-Riot-Token', Config.riotApiKey);
    tournamentApi: TournamentApi;
    summonerApi: SummonerApi;

    // summonerCache = new NodeCache({stdTTL: 3600 * 24, checkperiod: 120});
    summonerCache = new NodeCache({stdTTL: 1, checkperiod: 120});
    rateLimiter = new RateLimiter();

    constructor() {
        this.tournamentApi = new TournamentApi(new Configuration({
            basePath: Config.riotApiBasePath,
            middleware: [this.addRiotApiKey]
        }));
        this.summonerApi = new SummonerApi(new Configuration({
            basePath: Config.riotApiBasePath,
            middleware: [this.addRiotApiKey]
        }));

        this.rateLimiter.addBucket('app-20:1', 20, 1);
        this.rateLimiter.addBucket('app-100:120', 100, 120);
        this.rateLimiter.addBucket('getLobbyEvents-10:10', 10, 10);
        this.rateLimiter.addBucket('getLobbyEvents-500:600', 500, 600);
        this.rateLimiter.addBucket('registerProvider-10:10', 10, 10);
        this.rateLimiter.addBucket('registerProvider-500:600', 500, 600);
        this.rateLimiter.addBucket('registerTournament-10:10', 10, 10);
        this.rateLimiter.addBucket('registerTournament-500:600', 500, 600);
        this.rateLimiter.addBucket('generateCodes-10:10', 10, 10);
        this.rateLimiter.addBucket('generateCodes-500:600', 500, 600);
    }

    registerProvider(): Observable<number> {
        return this.rateLimiter.getAvailability(
            ['registerProvider-10:10', 'registerProvider-500:600', 'app-20:1', 'app-100:120']).pipe(
            mergeMap(() => this.tournamentApi.registerProvider({
                providerRegistrationParameters: {
                    region: 'NA',
                    url: 'http://ptsv2.com/t/fgzfw-1562945372/post'
                }
            }))
        );
    }

    registerTournament(providerId: number, serverName: string): Observable<number> {
        return this.rateLimiter.getAvailability(
            ['registerTournament-10:10', 'registerTournament-500:600', 'app-20:1', 'app-100:120']).pipe(
            mergeMap(() => this.tournamentApi.registerTournament({
                tournamentRegistrationParameters: {
                    providerId: providerId,
                    name: serverName
                }
            }))
        );
    }

    generateCode(tournamentId: number,
                 params: {
                     teamSize?: number,
                     pickType?: TournamentCodeParametersPickTypeEnum,
                     mapType?: TournamentCodeParametersMapTypeEnum,
                     spectatorType?: TournamentCodeParametersSpectatorTypeEnum,
                 }): Observable<Array<string>> {
        return this.rateLimiter.getAvailability(
            ['generateCodes-10:10', 'generateCodes-500:600', 'app-20:1', 'app-100:120']).pipe(
            mergeMap(() => this.tournamentApi.generateCode({
                tournamentId: tournamentId,
                count: 1,
                tournamentCodeParameters: {
                    teamSize: params.teamSize || 5,
                    pickType: params.pickType || TournamentCodeParametersPickTypeEnum.TOURNAMENTDRAFT,
                    mapType: params.mapType || TournamentCodeParametersMapTypeEnum.SUMMONERSRIFT,
                    spectatorType: params.spectatorType || TournamentCodeParametersSpectatorTypeEnum.ALL
                }
            }))
        );
    }

    getLobbyEvents(code: string): Observable<LobbyEventDTOWrapper> {
        return this.rateLimiter.getAvailability(
            ['getLobbyEvents-10:10', 'getLobbyEvents-500:600', 'app-20:1', 'app-100:120']).pipe(
            mergeMap(() => this.tournamentApi.getLobbyEvents({
                tournamentCode: code
            }))
        );
    }

    getSummoner(summonerId: string): Observable<SummonerDTO> {
        const summoner = this.summonerCache.get(summonerId);
        if (summoner == undefined) {
            return this.rateLimiter.getAvailability(
                ['app-20:1', 'app-100:120']).pipe(
                mergeMap(() => new Observable(observer => {
                    this.summonerApi.getSummoner({encryptedSummonerId: summonerId}).subscribe(
                        s => {
                            this.summonerCache.set(summonerId, s);
                            observer.next(s);
                            observer.complete();
                        }, error => observer.error(error)
                    );
                })));
        } else {
            // logger.verbose("Cache hit for summoner with id " + summonerId);
            return of(summoner);
        }
    }
}
