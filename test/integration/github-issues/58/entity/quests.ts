import { Column, Entity, OneToOne } from "typeorm";
import { feedextrainfo } from "./feedextrainfo";

@Entity("quests")
export class quests {

    @Column("int", {
        nullable: false,
        primary: true,
        name: "QuestId"
    })
    QuestId: number;

    @OneToOne(type => feedextrainfo, feedextrainfo => feedextrainfo.questId)
    feedextrainfo: feedextrainfo;

}
