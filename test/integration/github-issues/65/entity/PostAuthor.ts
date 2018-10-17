import { Column, Entity, JoinColumn, OneToOne, RelationId } from "typeorm";
import { Post } from "./Post";

@Entity("PostAuthor")
export class PostAuthor {

    @Column("int", {
        nullable: false,
        primary: true,
        name: "Id"
    })
    Id: number;

    @OneToOne(type => Post, Post => Post.Id)
    @JoinColumn()
    post: Post;

    @RelationId((postAuthor: PostAuthor) => postAuthor.post)
    postId: number;
}
