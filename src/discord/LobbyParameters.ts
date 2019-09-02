import {
    TournamentCodeParametersMapTypeEnum,
    TournamentCodeParametersPickTypeEnum,
    TournamentCodeParametersSpectatorTypeEnum
} from "../../generated/models";

export class LobbyParameters {
    private _editOriginalOnly: boolean;
    private _map: TournamentCodeParametersMapTypeEnum;
    private _teamSize: number;
    private _pickType: TournamentCodeParametersPickTypeEnum;
    private _spectatortype: TournamentCodeParametersSpectatorTypeEnum;

    static default(): LobbyParameters {
        return new LobbyParameters(
            false,
            TournamentCodeParametersMapTypeEnum.SUMMONERSRIFT,
            5,
            TournamentCodeParametersPickTypeEnum.DRAFTMODE,
            TournamentCodeParametersSpectatorTypeEnum.ALL
        );
    }

    private constructor(
        editoriginalonly: boolean,
        map: TournamentCodeParametersMapTypeEnum,
        teamSize: number,
        pickType: TournamentCodeParametersPickTypeEnum,
        spectatortype: TournamentCodeParametersSpectatorTypeEnum
    ) {
        this._editOriginalOnly = editoriginalonly;
        this._map = map;
        this._teamSize = teamSize;
        this._pickType = pickType;
        this._spectatortype = spectatortype;
    }

    set editOriginalOnly(value: string) {
        if (value == 'true') {
            this._editOriginalOnly = true;
        } else if (value == 'false') {
            this._editOriginalOnly = false;
        } else {
            throw new Error("Error while parsing value for option 'editOriginalOnly':" +
                " Value must be either 'true' or 'false'. Got: " + value)
        }
    }

    set map(value: string) {
        if (value == 'summonersrift') {
            this._map = TournamentCodeParametersMapTypeEnum.SUMMONERSRIFT;
        } else if (value == 'howlingabyss') {
            this._map = TournamentCodeParametersMapTypeEnum.HOWLINGABYSS;
        } else {
            throw new Error("Error while parsing value for option 'map':" +
                " Value must be either 'summonersrift' or 'howlingabyss'. Got: " + value)
        }

    }

    set teamSize(value: string) {
        let teamSize = parseInt(value);
        if (isNaN(teamSize)) {
            throw new Error("Error while parsing value for option 'teamSize':" +
                " Value must be numerical. Got: " + value)
        } else if (teamSize <= 0 || teamSize > 5) {
            throw new Error("Error while parsing value for option 'teamSize':" +
                " Value must be between 1 and 5. Got: " + value)
        }
        this._teamSize = teamSize;
    }

    set pickType(value: string) {
        switch (value) {
            case 'blind':
                this._pickType = TournamentCodeParametersPickTypeEnum.BLINDPICK;
                break;
            case 'draft':
                this._pickType = TournamentCodeParametersPickTypeEnum.DRAFTMODE;
                break;
            case 'random':
                this._pickType = TournamentCodeParametersPickTypeEnum.ALLRANDOM;
                break;
            case 'tournamentdraft':
                this._pickType = TournamentCodeParametersPickTypeEnum.TOURNAMENTDRAFT;
                break;
            default:
                throw new Error("Error while parsing value for option 'pickType':" +
                    " Value must be one of [blind|draft|random|tournamentdraft]. Got: " + value);
        }
    }

    set spectatorType(value: string) {
        switch (value) {
            case 'all':
                this._spectatortype = TournamentCodeParametersSpectatorTypeEnum.ALL;
                break;
            case 'lobbyonly':
                this._spectatortype = TournamentCodeParametersSpectatorTypeEnum.LOBBYONLY;
                break;
            case 'none':
                this._spectatortype = TournamentCodeParametersSpectatorTypeEnum.NONE;
                break;
            default:
                throw new Error("Error while parsing value for option 'spectatortype':" +
                    " Value must be one of [none|lobbyonly|all]. Got: " + value);
        }
    }

    get map(): string {
        switch (this._map) {
            case TournamentCodeParametersMapTypeEnum.SUMMONERSRIFT:
                return "Summoner's Rift";
            case TournamentCodeParametersMapTypeEnum.HOWLINGABYSS:
                return "Howling Abyss";
            default:
                return "";
        }
    }

    get teamSize(): string {
        return String(this._teamSize);
    }

    get pickType(): string {
        switch (this._pickType) {
            case TournamentCodeParametersPickTypeEnum.BLINDPICK:
                return "Blind Pick";
            case TournamentCodeParametersPickTypeEnum.DRAFTMODE:
                return "Draft Mode";
            case TournamentCodeParametersPickTypeEnum.ALLRANDOM:
                return "All Random";
            case TournamentCodeParametersPickTypeEnum.TOURNAMENTDRAFT:
                return "Tournament Draft";
            default:
                return "";
        }
    }

    get rawMap(): TournamentCodeParametersMapTypeEnum {
        return this._map;
    }

    get rawTeamSize(): number {
        return this._teamSize;
    }

    get rawPickType(): TournamentCodeParametersPickTypeEnum {
        return this._pickType;
    }

    get rawSpectatorType() {
        return this._spectatortype;
    }
}
