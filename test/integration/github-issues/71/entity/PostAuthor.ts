import { Column, Entity, JoinColumn, OneToOne } from "typeorm";
import { Post } from "./Post";

@Entity("PostAuthor")
export class PostAuthor {

    @Column("int", {
        nullable: false,
        primary: true,
        name: "Id"
    })
    Id: number;

    @OneToOne(type => Post, Post => Post.Id, {
        onDelete: "CASCADE"
        // onUpdate: "CASCADE"
    })
    @JoinColumn()
    post: Post;

}
