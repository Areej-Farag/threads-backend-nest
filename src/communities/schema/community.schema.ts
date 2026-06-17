// backend/src/communities/schemas/community.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import mongoose, { HydratedDocument, Types } from 'mongoose';

export type CommunityDocument = HydratedDocument<Community>;

@Schema({ timestamps: true })
export class Community {
  @Prop({ required: true })
  name!: string;

  @Prop()
  description?: string;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Thread' }] })
  threads!: Types.ObjectId[];

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] })
  members!: Types.ObjectId[];

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true })
  creator!: Types.ObjectId;

  @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }] })
  admins!: Types.ObjectId[];

  @Prop()
  communityPicture?: string;
}

export const CommunitySchema = SchemaFactory.createForClass(Community);

// ====================== Pre Delete Hook ======================
CommunitySchema.pre(
  'findOneAndDelete',
  async function (this: mongoose.Query<any, Community>) {
    try {
      const communityId = this.getQuery()._id as Types.ObjectId;

      if (!communityId) return;

      // حذف كل الثريدز اللي مرتبطة بالكوميونيتي
      const deletedThreads = await this.model.db.model('Thread').deleteMany({
        community: communityId,
      });

      console.log(
        `🗑️ Pre-hook: Deleted ${deletedThreads.deletedCount} threads for community ${communityId.toString()}`,
      );
    } catch (error) {
      console.error('Error in community pre-delete hook:', error);
      throw error; // مهم: عشان يفشل الحذف لو حصل مشكلة
    }
  },
);
