import mongoose, {  Document, Model, Schema } from 'mongoose';
import { User } from './User';

export interface RefreshToken extends Document {
    user: User['_id'],
    token: string,
    expires: Date,
    created: Date,
    createdByIp: string,
    revoked: Date,
    revokedByIp: string,
    replacedByToken: string
    isExpired: boolean,
    isActive: boolean
}

export const RefreshTokenSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User' },
    token: { type: String },
    expires: { type: Date },
    created: { type: Date, default: Date.now },
    createdByIp: { type: String },
    revoked: { type: Date },
    revokedByIp: { type: String },
    replacedByToken: { type: String },
});

RefreshTokenSchema.virtual('isExpired').get(function () {
    return Date.now() >= this.expires;
});

RefreshTokenSchema.virtual('isActive').get(function () {
    return !this.revoked && !this.isExpired;
});

RefreshTokenSchema.set('toJSON', {
    virtuals: true,
    versionKey: false
});

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface RefreshTokenModel extends Model<RefreshToken> {}

export default mongoose.model<RefreshToken, RefreshTokenModel>('RefreshToken', RefreshTokenSchema);