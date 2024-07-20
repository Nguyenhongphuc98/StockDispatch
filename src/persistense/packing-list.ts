import "reflect-metadata";
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, Unique, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne } from "typeorm";
import { PackingListItemEntity } from "./packling-list-item";
import { UserEntity } from "./users";

export type PackingListModel = {
	attachedInvoiceId: string;
	date: number;
	from: string;
	to: string;
	etdFactory: string;
	etdPort: string;
	eta: string;
};


@Entity('PackingList')
export class PackingListEntity extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: string;

    @CreateDateColumn()
    createAt: Date;

    @UpdateDateColumn()
    updateAt: Date;

    @ManyToOne(() => UserEntity, (u) => u.packingLists)
    createdBy: UserEntity;

    @Column()
    attachedInvoiceId: string;

    @Column()
	date: number;

    @Column()
	from: string;

    @Column()
	to: string;

    @Column()
	etdFactory: string;

    @Column()
	etdPort: string;

    @Column()
	eta: string;

    @OneToMany(() => PackingListItemEntity, (it) => it.packingList)
    items: PackingListItemEntity[];

    init(model: PackingListModel, creator: UserEntity) {
        this.createdBy = creator;
        this.attachedInvoiceId = model.attachedInvoiceId;
        this.date = model.date;
        this.from = model.from;
        this.to = model.to;
        this.etdFactory = model.etdFactory;
        this.etdPort = model.etdPort;
        this.eta = model.eta;
        this.items =[];
    }

    validate() {
        for (const p in this) {
            if (Object.prototype.hasOwnProperty.call(this, p)) {
                const element = this[p];
                if (!element) {
                    return false;
                }
            }
        }

        return true;
    }

    toModel() {
        return this;
    }
}
