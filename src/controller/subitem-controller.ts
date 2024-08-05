import { In, Not } from "typeorm";
import Logger from "../loger";
import { PackingListEntity } from "../persistense/packing-list";
import { PackingListItemEntity } from "../persistense/packling-list-item";
import { SubItemEntity } from "../persistense/sub-item";
import { bunddleSettings } from "../product/bundle-setting";
import { AppDataSource } from "../persistense/data-src";

const TAG = "[WLI]";

const DEFAULT_WEIGH = 0;

export class SubItemController {
    buildWeighItems(
        max: number,
        pkl: PackingListEntity,
        pklItem: PackingListItemEntity
      ) {
        const results: SubItemEntity[] = [];
        const start = pklItem.startSeries();
        const end = pklItem.endSeries();
    
        let s = start;
        while (s <= end) {
          let e = Math.min(s + max - 1, end);
          const weighItem = new SubItemEntity();
          weighItem.init(
            {
              packageSeries: [s, e],
              parentPackageSeries: [pklItem.startSeries(), pklItem.endSeries()],
              grossWeight: DEFAULT_WEIGH,
            },
            pkl,
            pklItem
          );
          results.push(weighItem);
          s = e + 1;
        }
    
        return results;
      }
    
      async anyItem(pklId: string): Promise<boolean> {
        const entity = await SubItemEntity.findOneBy({
          packingList: {
            id: pklId,
          },
        });
    
        return !!entity;
      }
    
      async countAll(pklIds: string[]) {
        return SubItemEntity.countBy({
          packingList: {
            id: In(pklIds),
          },
        });
      }
    
      async countWeighed(pklIds: string[]) {
        return SubItemEntity.countBy({
          packingList: {
            id: In(pklIds),
          },
          grossWeight: Not(DEFAULT_WEIGH)
        });
      }
    
      async countExported(pklIds: string[]) {
        return SubItemEntity.countBy({
          packingList: {
            id: In(pklIds),
          },
          exportTime: Not(null)
        });
      }
    
      async createSubItemsIfNotExists(sessionId: string,pkl: string) {
        debugger;
        const created = await this.anyItem(pkl);
        if (!created) {
          try {
      
            const pklEntity = await PackingListEntity.findOne({
              where: {
                id: pkl
              }
            });
      
      
            if (!pklEntity) {
              Logger.log(TAG, "create subItem not found pkl");
              return false
            }
     
            const pklItemEntities = await PackingListItemEntity.find({
              where: { packingList: { id: pkl } }
            });
       
            await this.createSubItems(sessionId, pklEntity, pklItemEntities);
            return true
          } catch (error) {
            Logger.log(TAG, "create subItem err", error);
            return false;
          }
        }
      
        return true;
      }
      
      async createSubItems(
        sessionId: string,
        pkl: PackingListEntity,
        pklItems: PackingListItemEntity[]
      ) {
        Logger.log(
          TAG,
          "createSubItems",
          sessionId,
          pkl.id,
          pklItems.map((v) => v.id)
        );
      
        const queryRunner = AppDataSource.createQueryRunner();
      
        await queryRunner.connect();
        await queryRunner.startTransaction();
      
        try {
          const WLIentities = pklItems
            .map((item) => {
              const maxBoxes = bunddleSettings.boxesAmount(item.packageId);
              return this.buildWeighItems(maxBoxes, pkl, item);
            })
            .flat();
      
          await queryRunner.manager.save(SubItemEntity, WLIentities);
          await queryRunner.commitTransaction();
        } catch (error) {
          Logger.error(
            TAG,
            "createSubItems fail",
            sessionId,
            pklItems[0]?.packingList.id,
            pklItems.map((v) => v.id),
            error
          );
          await queryRunner.release();
          await queryRunner.rollbackTransaction();
      
          throw error;
        } finally {
          await queryRunner.release();
        }
      }
}

const subItemController = new SubItemController();
export default subItemController;
