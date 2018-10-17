import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from "typeorm";
import { Post } from "./Post";

@Entity("PostDetail")
export class PostDetail {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    authorName: string;

    @Column()
    comment: string;

    @Column()
    metadata: string;

    @ManyToMany(type => Post, post => post.postDetails)
    posts: Post[];

}
