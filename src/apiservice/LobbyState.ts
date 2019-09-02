import {Summoner} from "./Summoner";

export interface LobbyState {
    lobbyStatus: LobbyStatus;
    summoners: Summoner[];
}

export enum LobbyStatus {
    PRE_GAME = 'Pre-Game Lobby',
    CHAMP_SELECT = 'Champion Select',
    IN_GAME = 'In Game'
}
