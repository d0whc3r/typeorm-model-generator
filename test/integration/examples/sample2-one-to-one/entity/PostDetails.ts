import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from "typeorm";
import { Post } from "./Post";

@Entity("PostDetails")
export class PostDetails {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    authorName: string;

    @Column()
    comment: string;

    @Column()
    metadata: string;

    @OneToOne(type => Post, post => post.details, {
        // cascade: true,
    })
    post: Post;

}
