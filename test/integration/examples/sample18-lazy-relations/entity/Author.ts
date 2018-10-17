import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Post } from "./Post";

@Entity("Author")
export class Author {

    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @OneToMany(type => Post, post => post.author, {
        // cascade: true
    })
    posts: Promise<Post[]>;

    // /**
    //  * You can add this helper method.
    //  */
    // asPromise() {
    //     return Promise.resolve(this);
    // }

}
