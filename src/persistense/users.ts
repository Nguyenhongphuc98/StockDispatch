import "reflect-metadata";
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, Unique, UpdateDateColumn, CreateDateColumn, OneToMany } from "typeorm";
// import { PackingList } from "./packing-lists";

export enum Role {
    Admin = 1,
    User = 2,
};

@Entity('User')
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: string;

    @CreateDateColumn()
    createAt: string;

    @UpdateDateColumn()
    updateAt: string;

    @Column('text', {unique: true})
    username: string;

    @Column('text')
    password: string;

    @Column('text')
    displayName: string;

    @Column('boolean')
    isActive: boolean;

    @Column('int')
    role: Role;

    @Column('text')
    salt: string;

    // @OneToMany(() => PackingList, pl => pl.updater)
    // packingLists: PackingList;
}
