import "reflect-metadata";
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, Unique, CreateDateColumn, UpdateDateColumn, OneToMany, ManyToOne } from "typeorm";
import { Item } from "./items";
import { User } from "./users";


@Entity('PackingList')
export class PackingList extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: string;

    @CreateDateColumn()
    createAt: string;

    @UpdateDateColumn()
    updateAt: string;

    @Column('text')
    name: string;

    @ManyToOne(() => User, (u) => u.packingLists)
    updater: User;

    @OneToMany(() => Item, (it) => it.packingList)
    items: Item[];
}
