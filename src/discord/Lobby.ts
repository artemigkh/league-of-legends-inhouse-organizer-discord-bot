import {Message, ReactionCollector, RichEmbed, TextChannel, User} from "discord.js";
import {logger} from "../Logger";
import {InHouseBot} from "./InHouseBot";
import {Summoner} from "../apiservice/Summoner";
import {LobbyState, LobbyStatus} from "../apiservice/LobbyState";
import {LobbyParameters} from "./LobbyParameters";

export class Lobby {
    private static refreshEmote = '🔄';

    private inHouseBot: InHouseBot;
    private readonly channel: TextChannel;
    private readonly owner: User;
    private readonly parameters: LobbyParameters;
    private display: RichEmbed;
    private collector: ReactionCollector = null;

    private readonly newMessageOnUpdate: boolean;
    private readonly code: string;
    private summonersInLobby: Summoner[] = [];
    private lobbyStatus: LobbyStatus;

    constructor(channel: TextChannel, owner: User, lobbyParameters: LobbyParameters, code: string, inHouseBot: InHouseBot) {
        logger.info('Creating inhouse lobby');
        this.inHouseBot = inHouseBot;
        this.channel = channel;
        this.owner = owner;
        this.newMessageOnUpdate = true;
        this.code = code;
        this.parameters = lobbyParameters;
        this.requestLobbyRefresh();
    }

    public notifyRefresh(lobbyState: LobbyState) {
        this.summonersInLobby = lobbyState.summoners;
        this.lobbyStatus = lobbyState.lobbyStatus;
        this.sendNewMessage();
    }

    private createDisplay(): RichEmbed {
        let display = new RichEmbed()
            .setColor('#949c95')
            .setTitle(this.owner.username + '\'s Inhouse Lobby');

        if (this.lobbyStatus == LobbyStatus.PRE_GAME) {
            display.addField('Join Now! ' + String(10-this.summonersInLobby.length) + ' Spots Left', this.code);
            display.addField('Lobby Information: ',
                `Map: ${this.parameters.map}, ` +
                `Pick Type: ${this.parameters.pickType}, ` +
                `Team Size: ${this.parameters.teamSize}`)
        }

        display.addField('Lobby Status:', this.lobbyStatus);

        if (this.summonersInLobby.length > 0) {
            display.addField('Players in Lobby:\nName', this.summonersInLobby.map(s => s.name).join('\n'), true);
            display.addField('\u200b\nLevel', this.summonersInLobby.map(s => s.level).join('\n'), true);
        }

        display.setFooter('Lobby state refreshes periodically. To force a refresh, click the refresh react');

        return display;
    }

    private requestLobbyRefresh() {
        this.inHouseBot.refreshLobby(this.code);
    }

    private createRefreshListener(message: Message) {
        //todo: listen only on server/channel/msg
        if (this.collector != null) {
            this.collector.cleanup();
            delete this.collector;
        }
        this.collector = message.createReactionCollector(reaction => reaction.emoji.name == Lobby.refreshEmote);
        this.collector.on('collect', collector => {
            if (collector.count > 1) {
                this.requestLobbyRefresh();
            }
        });
    }

    private sendNewMessage() {
        this.display = this.createDisplay();
        this.channel.send(this.display)
            .then((message: Message) => {
                console.log('reacting to message');
                message.react(Lobby.refreshEmote)
                    .then(() => this.createRefreshListener(message))
                    .catch(error => logger.error(error))
            })
            .catch(error => logger.error(error));
    }


}
