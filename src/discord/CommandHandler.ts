import {InHouseBot} from "./InHouseBot";
import {Message, RichEmbed, TextChannel} from "discord.js";
import {logger} from "../Logger";
import {Config} from "../Config";
import {LobbyParameters} from "./LobbyParameters";

export class CommandHandler {
    private inHouseBot: InHouseBot;

    constructor(inHouseBot: InHouseBot) {
        this.inHouseBot = inHouseBot;
        this.inHouseBot.registerMessageHandler(message => this.handleCommands(message));
    }

    private handleCommands(message: Message): void {
        if (!message.content.startsWith(Config.cmdPrefix) || message.author.bot) {
            return;
        }

        logger.verbose(`Processing command: ${message.content}`);
        const args = message.content.slice(Config.cmdPrefix.length).split(/ +/);
        args.shift();
        const command = args.length > 0 ? args.shift().toLowerCase() : 'help';
        switch (command) {
            case 'echo':
                this.handleEchoCommand(message, args);
                break;
            case 'new':
                this.handleCreateLobbyCommand(message, args);
                break;
            case 'help':
                this.handleHelpCommand(message, args);
                break;
            default:
                this.handleHelpCommand(message, args);
        }
    }

    private handleEchoCommand(message: Message, args: string[]) {
        message.channel.send(args[0]);
    }

    private handleCreateLobbyCommand(message: Message, args: string[]) {
        const lobbyParameters = LobbyParameters.default();
        try {
            args.forEach(arg => {
                const optionValuePair = arg.split('=');
                if (optionValuePair.length != 2) {
                    throw new Error("Error encountered during argument " + arg + ". Arguments must be of the form" +
                        " option=value .");
                }
                const option = optionValuePair[0];
                const value = optionValuePair[1];

                switch (option) {
                    case 'editoriginalonly':
                        lobbyParameters.editOriginalOnly = value;
                        break;
                    case 'teamsize':
                        lobbyParameters.teamSize = value;
                        break;
                    case 'map':
                        lobbyParameters.map = value;
                        break;
                    case 'picktype':
                        lobbyParameters.pickType = value;
                        break;
                    case 'spectatortype':
                        lobbyParameters.spectatorType = value;
                        break;
                    default:
                        throw new Error("Unrecognized option: " + option);
                }
            });
        } catch (e) {
            message.channel.send(e.message);
            return
        }

        this.inHouseBot.createNewLobby(<TextChannel>message.channel, message.author, lobbyParameters)
    }

    private handleHelpCommand(message: Message, args: string[]) {
        message.channel.send(new RichEmbed()
            .setColor('#7a817b')
            .setTitle('League of Legends Inhouse Organizer')
            .setDescription('A bot for generating tournament codes for use in the league client to organize ' +
                'inhouse lobbies and automatically track the lobby status in real time')
            .addField(`${Config.cmdPrefix} help`, 'Show this message')
            .addField(`${Config.cmdPrefix} new [options]`, 'Create a new inhouse lobby. Options can be changed' +
                'by specifying them space separated in the form option=value . Available options are listed below')
            .addField('\u200b\neditOriginalOnly', 'If true, will not make new messages in the channel when lobby state ' +
                'updates. If false, will make a new message if the lobby state has updated and is not the latest ' +
                'message in the channel')
            .addField('Allowed Values', 'true\nfalse', true)
            .addField('Default', 'false', true)
            .addField('\u200b\nmap', 'The map on which the lobby will play')
            .addField('Allowed Values', 'summonersrift\nhowlingabyss', true)
            .addField('Default', 'summonersrift', true)
            .addField('\u200b\nteamsize', 'The size of each team')
            .addField('Allowed Values', '[1-5]', true)
            .addField('Default', '5', true)
            .addField('\u200b\npicktype', 'Champion Select Pick Type')
            .addField('Allowed Values', 'blind\ndraft\nrandom\ntournamentdraft', true)
            .addField('Default', 'draft', true)
            .addField('\u200b\nspectatortype', 'Allowed Spectator Types')
            .addField('Allowed Values', 'none\nlobbyonly\nall', true)
            .addField('Default', 'all', true)
        );
    }
}
