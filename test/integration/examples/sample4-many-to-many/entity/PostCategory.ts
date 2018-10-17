import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("PostCategory")
export class PostCategory {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

}
