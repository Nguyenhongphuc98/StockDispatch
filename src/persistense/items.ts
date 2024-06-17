import "reflect-metadata";
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, Unique, CreateDateColumn, UpdateDateColumn, ManyToOne } from "typeorm";
import { PackingList } from "./packing-lists";


@Entity('Item')
export class Item extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: string;

    @CreateDateColumn()
    createAt: string;

    @UpdateDateColumn()
    updateAt: string;

    @ManyToOne(() => PackingList, (pl) => pl.items)
    packingList: PackingList;

    @Column('text')
    scanner: string;

    @Column('number')
    qrNum: number;

    @Column('number')
    itemNum: number;

    @Column('number')
    invoice: number;

    @Column('number')
    boxNum: number;

    @Column('number')
    amount: number;

    @Column('text')
    remark: string;
}
