import { Entity, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { PostAuthor } from "./PostAuthor";

@Entity("Post")
export class Post {

    @PrimaryGeneratedColumn()
    id: number;

    @ManyToOne(type => PostAuthor, author => author.posts)
    author: PostAuthor;

    @ManyToOne(type => PostAuthor, author => author.posts2)
    author2: PostAuthor;

}
