import { async, Observable, Subscriber } from "rxjs";
import { LolApi } from "twisted";
import { RegionGroups, Regions } from "twisted/dist/constants";
import { ChampionMasteryDTO, ChampionsDataDragonDetailsSolo, MatchDto, MatchV5DTOs } from "twisted/dist/models-dto";

interface ChampionMasteryExtended extends ChampionMasteryDTO {
  champion: ChampionsDataDragonDetailsSolo;
}

export class LolUtils {
  private lolApi: LolApi;
  private region: Regions;
  private regionGroup: RegionGroups;

  constructor(lolApi: LolApi, region: Regions, regionGroup: RegionGroups) {
    this.lolApi = lolApi;
    this.region = region;
    this.regionGroup = regionGroup;
  }

  async getLatestDataDragonVersion(): Promise<string> {
    return (await this.lolApi.DataDragon.getVersions())[0];
  }

  async retrieveMatchInformation(puuid: string, count: number = 20) {
    const matches = (
      await this.lolApi.MatchV5.list(puuid, this.regionGroup, {
        count,
      })
    ).response;

    return new Observable((subscriber: Subscriber<MatchV5DTOs.MatchDto>) => {
      (async () => {
        for (let i = 0; i < matches.length; i++) {
          const matchInfo = (await this.lolApi.MatchV5.get(matches[i], this.regionGroup)).response;

          subscriber.next(matchInfo);

          if (i == matches.length - 1) {
            subscriber.complete();
          }
        }
      })();
    });
  }

  async getCompleteSummonerProfile(summonername: string) {
    const summoner = (await this.lolApi.Summoner.getByName(summonername, this.region)).response;
    const league = (await this.lolApi.League.bySummoner(summoner.id, this.region)).response;
    const mastery = (await this.lolApi.Champion.masteryBySummoner(summoner.id, this.region)).response;

    const extendedMastery: ChampionMasteryExtended[] = [];

    for (let i = 0; i < mastery.length; i++) {
      const dataDragonChampion = await this.lolApi.DataDragon.getChampion(mastery[i].championId);

      extendedMastery.push({
        ...mastery[i],
        champion: dataDragonChampion,
      });
    }

    return {
      summoner,
      league,
      mastery,
    };
  }
}
