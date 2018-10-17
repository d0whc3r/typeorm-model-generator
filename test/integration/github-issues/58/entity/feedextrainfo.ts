import { Column, Entity, Index, JoinColumn, OneToOne } from "typeorm";
import { users } from "./users";
import { quests } from "./quests";

@Entity("feedextrainfo")
@Index("feedExtraInfo_FeedOwnerId_idx", ["feedOwnerId"])
@Index("feedExtraInfo_ReaderId_idx", ["readerId"])
@Index("feedExtraInfo_QuestId_idx", ["questId"])
export class feedextrainfo {

    @OneToOne(type => users, FeedOwnerId => FeedOwnerId.feedextrainfo, { primary: true, nullable: false })
    @JoinColumn({ name: "FeedOwnerId" })
    feedOwnerId: users;

    @OneToOne(type => quests, QuestId => QuestId.feedextrainfo, { primary: true, nullable: false })
    @JoinColumn({ name: "QuestId" })
    questId: quests;

    @OneToOne(type => users, ReaderId => ReaderId.feedextrainfo2, { primary: true, nullable: false })
    @JoinColumn({ name: "ReaderId" })
    readerId: users;

    @Column("int", {
        nullable: false,
        name: "MostUpdatedFeedEntryIdUserRead"
    })
    MostUpdatedFeedEntryIdUserRead: number;

}
