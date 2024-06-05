import "reflect-metadata";
import { Entity, PrimaryGeneratedColumn, Column, BaseEntity, Unique } from "typeorm";

export enum Role {
    Admin = 1,
    User = 2,
};

@Entity('User')
export class User extends BaseEntity {
    @PrimaryGeneratedColumn()
    id: string;

    @Column('text', {unique: true})
    username: string;

    @Column('text')
    password: string;

    @Column('boolean')
    isActive: boolean;

    @Column('int')
    role: Role;

    @Column('text')
    salt: string;
}
