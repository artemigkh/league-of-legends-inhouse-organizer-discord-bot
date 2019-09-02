import {Client, Message, TextChannel, User} from "discord.js";
import {CommandHandler} from "./CommandHandler";
import {Lobby} from "./Lobby";
import {ApiService} from "../apiservice/ApiService";
import {logger} from "../Logger";
import {Config} from "../Config";
import {LobbyParameters} from "./LobbyParameters";

export class InHouseBot {
    private client: Client;
    private commandHandler: CommandHandler;
    private apiService: ApiService;

    private lobbiesMap: Map<string, Lobby>;

    constructor() {
        logger.info('Creating Inhouse Bot');
        this.client = new Client();
        this.client.login(Config.discordToken).then(
            success => logger.info(`Successfully logged in with api key ${success}`),
            err => logger.error(err)
        );

        this.commandHandler = new CommandHandler(this);
        this.apiService = new ApiService();
        this.lobbiesMap = new Map();
    }

    registerMessageHandler(messageHandler: (message: Message) => void): void {
        this.client.on('message', message => messageHandler(message));
    }

    createNewLobby(channel: TextChannel, owner: User, lobbyParameters: LobbyParameters) {
            this.apiService.generateCode({
                teamSize: lobbyParameters.rawTeamSize,
                pickType: lobbyParameters.rawPickType,
                mapType: lobbyParameters.rawMap,
                spectatorType: lobbyParameters.rawSpectatorType
            }).subscribe(
                code => this.lobbiesMap.set(code, new Lobby(channel, owner, lobbyParameters, code, this)),
                error => logger.error(error)
            );
    }

    refreshLobby(code: string) {
        logger.verbose(`Starting lobby refresh for lobby with code ${code}`);
        this.apiService.getLobbyState(code).subscribe(
            summoners => {
                if (this.lobbiesMap.has(code)) {
                    this.lobbiesMap.get(code).notifyRefresh(summoners);
                } else {
                    logger.error("Trying to update non-existing lobby with code " + code);
                }
            }, error => logger.error(error)
        );

    }
}
