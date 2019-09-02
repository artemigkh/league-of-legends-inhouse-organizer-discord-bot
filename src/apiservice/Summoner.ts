import {SummonerDTO} from "../../generated/models";

export class Summoner {
    name: string;
    level: number;

    constructor(s: SummonerDTO) {
        this.name = s.name;
        this.level = s.summonerLevel;
    }

    public getFormattedEntry(): string {
        return (this.name + '\u0020'.repeat(20 - this.name.length) + String(this.level) + '\n');
    }
}
