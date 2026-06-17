// backend/src/threads/schema/thread.schema.ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type MediaDocument = HydratedDocument<Media>;

@Schema({ timestamps: true })
export class Media {
  @Prop({ type: String, required: true })
  url!: string;

  @Prop({ type: String, required: true })
  name!: string;

  @Prop({ type: String, required: true })
  public_id!: string;
  @Prop()
  mimeType!: string;

  @Prop()
  size!: number;

  @Prop({ type: String, enum: ['profile', 'thread'] }) // للتصنيف
  type!: string;
}

export const MediaSchema = SchemaFactory.createForClass(Media);
