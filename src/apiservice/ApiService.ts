import {ApiWrapper} from "./ApiWrapper";
import {forkJoin, Observable, of, ReplaySubject} from "rxjs";
import {logger} from "../Logger";
import {
    LobbyEventDTOEventTypeEnum,
    LobbyEventDTOWrapper,
    TournamentCodeParametersMapTypeEnum,
    TournamentCodeParametersPickTypeEnum, TournamentCodeParametersSpectatorTypeEnum
} from "../../generated/models"
import {Summoner} from "./Summoner";
import {LobbyState, LobbyStatus} from "./LobbyState";

export class ApiService {
    private apiWrapper = new ApiWrapper();

    providerId: number;

    private tournamentIdSource = new ReplaySubject<number>(1);
    private tournamentId$ = this.tournamentIdSource.asObservable();

    constructor() {
        this.registerAsTournamentProvider();
    }

    generateCode(params: {
        teamSize?: number,
        pickType?: TournamentCodeParametersPickTypeEnum,
        mapType?: TournamentCodeParametersMapTypeEnum,
        spectatorType?: TournamentCodeParametersSpectatorTypeEnum,
    }): Observable<string> {
        return new Observable<string>(observer => {
            this.tournamentId$.subscribe(
                tournamentId => {
                    this.apiWrapper.generateCode(tournamentId, params).subscribe(
                        oneCodeArray => {
                            logger.verbose(`Got tournament code from API: ${oneCodeArray}`);
                            observer.next(oneCodeArray[0])
                        },
                        error => {
                            logger.error(error);
                            observer.error(error)
                        }
                    );
                }, error => {
                    logger.error(error);
                    observer.error(error)
                }
            );
        });
    }

    getLobbyState(code: string): Observable<LobbyState> {
        return new Observable<LobbyState>(observer => {
                this.apiWrapper.getLobbyEvents(code).subscribe(
                    lobbyEvents => {
                        let lobbyStatus: LobbyStatus;
                        const eventTypes = new Set(lobbyEvents.eventList.map(e => e.eventType));
                        if (eventTypes.has(LobbyEventDTOEventTypeEnum.GameAllocatedToLsmEvent)) {
                            lobbyStatus = LobbyStatus.IN_GAME;
                        } else if (eventTypes.has(LobbyEventDTOEventTypeEnum.ChampSelectStartedEvent)) {
                            lobbyStatus = LobbyStatus.CHAMP_SELECT;
                        } else {
                            lobbyStatus = LobbyStatus.PRE_GAME;
                        }
                        this.getSummonersFromIds(this.getSummonerIdsInLobby(lobbyEvents)).subscribe(
                            summoners => observer.next({
                                lobbyStatus: lobbyStatus,
                                summoners: summoners
                            }),
                            error => observer.error(error)
                        );
                    },
                    error => {
                        logger.error(error);
                        observer.error(error)
                    }
                );
            }
        );
    }

    private getSummonerIdsInLobby(events: LobbyEventDTOWrapper): string[] {
        let summonerIdsInLobby = [];
        events.eventList.forEach(event => {
            if (event.eventType == LobbyEventDTOEventTypeEnum.PlayerJoinedGameEvent) {
                summonerIdsInLobby.push(event.summonerId);
            } else if (event.eventType == LobbyEventDTOEventTypeEnum.PlayerQuitGameEvent) {
                summonerIdsInLobby = summonerIdsInLobby.filter(id => id != event.summonerId);
            }
        });
        return summonerIdsInLobby;
    }

    private getSummonerFromId(summonerId: string): Observable<Summoner> {
        return new Observable(observer => {
            this.apiWrapper.getSummoner(summonerId).subscribe(
                summoner => {
                    observer.next(new Summoner(summoner));
                    observer.complete();
                },
                error => observer.error(error)
            );
        });
    }

    private getSummonersFromIds(summonerIds: string[]): Observable<Summoner[]> {
        if (summonerIds.length > 0) {
            return forkJoin(summonerIds.map(summonerId => this.getSummonerFromId(summonerId)));
        } else {
            return of([]);
        }
    }

    private registerAsTournamentProvider() {
        this.apiWrapper.registerProvider().subscribe(
            providerId => {
                logger.info(`Registered as tournament provider with id ${providerId}`);
                this.providerId = providerId;

                //TODO: diff tournament per server
                this.apiWrapper.registerTournament(this.providerId, 'test server').subscribe(
                    tournamentId => {
                        logger.info(`Registered as tournament with id ${tournamentId}`);
                        this.tournamentIdSource.next(tournamentId);
                    }
                );

            }, error => console.error(error)
        );
    }


}
