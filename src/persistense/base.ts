import { BaseEntity } from "typeorm";

export class BaseRepository extends BaseEntity {
  getMissingFields() {
    const missFields = [];
    for (const p in this) {
      if (Object.prototype.hasOwnProperty.call(this, p)) {
        const element = this[p];
        if (element == undefined) {
          missFields.push(p);
        }
      }
    }

    return missFields;
  }
}
