import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Post } from "./Post";

@Entity("PostMetadata")
export class PostMetadata {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    description: string;

    @OneToOne(type => Post, post => post.metadata)
    post: Post;

}
