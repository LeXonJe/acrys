import { async, Observable, Subscriber } from "rxjs";
import { LolApi } from "twisted";
import { RegionGroups, Regions } from "twisted/dist/constants";
import { ChampionMasteryDTO, ChampionsDataDragonDetailsSolo, MatchDto, MatchV5DTOs } from "twisted/dist/models-dto";

interface ChampionMasteryExtended extends ChampionMasteryDTO {
  champion: ChampionsDataDragonDetailsSolo;
}

interface UsedChampion {
  champId: number;
  champName: string;
  used: number;
}

interface MostUsedChampions {
  [id: string]: UsedChampion;
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

  async predictPicks(puuid: string, mastery: ChampionMasteryExtended[], count: number = 5) {}

  getMostUsedChampions(puuid: string, depth: number) {
    const mostUsedChamps: MostUsedChampions = {};

    return new Observable((subscriber: Subscriber<MostUsedChampions>) => {
      (async () => {
        (await this.retrieveMatchInformation(puuid, depth)).subscribe({
          next(match) {
            for (let i = 0; i < match.info.participants.length; i++) {
              const participant = match.info.participants[i];

              if (participant.puuid === puuid) {
                if (!mostUsedChamps[participant.championId]) {
                  mostUsedChamps[participant.championId] = {
                    champId: participant.championId,
                    champName: participant.championName,
                    used: 1,
                  };
                } else {
                  mostUsedChamps[participant.championId].used++;
                }

                subscriber.next(mostUsedChamps);
                break;
              }
            }
          },
          error(e) {
            subscriber.error(e);
          },
          complete() {
            subscriber.complete();
          },
        });
      })();
    });
  }

  async retrieveMatchInformation(puuid: string, count: number = 20) {
    const matches = (
      await this.lolApi.MatchV5.list(puuid, this.regionGroup, {
        count,
      })
    ).response;

    return new Observable((subscriber: Subscriber<MatchV5DTOs.MatchDto>) => {
      (async () => {
        try {
          for (let i = 0; i < matches.length; i++) {
            const matchInfo = (await this.lolApi.MatchV5.get(matches[i], this.regionGroup)).response;

            subscriber.next(matchInfo);

            if (i == matches.length - 1) {
              subscriber.complete();
            }
          }
        } catch (e) {
          subscriber.error(e);
        }
      })();
    });
  }

  async getMasteryPoints(summonerId: string) {
    const mastery = (await this.lolApi.Champion.masteryBySummoner(summonerId, this.region)).response;

    const extendedMastery: ChampionMasteryExtended[] = [];

    for (let i = 0; i < mastery.length; i++) {
      try {
        const dataDragonChampion = await this.lolApi.DataDragon.getChampion(mastery[i].championId);

        extendedMastery.push({
          ...mastery[i],
          champion: dataDragonChampion,
        });
      } catch (e) {}
    }

    return extendedMastery;
  }

  async getCompleteSummonerProfile(summonername: string) {
    const summoner = (await this.lolApi.Summoner.getByName(summonername, this.region)).response;
    const league = (await this.lolApi.League.bySummoner(summoner.id, this.region)).response;

    return {
      summoner,
      league,
    };
  }
}
