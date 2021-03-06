import { Column, Entity, JoinColumn, OneToOne } from "typeorm";
import { Post } from "./Post";

@Entity("PostDetails")
export class PostDetails {

    @Column("int", {
        nullable: false,
        primary: true,
        name: "Id"
    })
    Id: number;

    @OneToOne(type => Post, Post => Post.Id,
        {
            onDelete: "SET NULL"
            // onUpdate: "SET NULL"
        })
    @JoinColumn()
    post: Post;

}
