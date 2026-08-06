import couponModel from '../models/coupon.model'

export default {
    findAllCoupons: (filter: Record<string, unknown> = {}) => {
        const query = { isDeleted: false, ...filter }
        return couponModel.find(query).sort({ createdAt: -1 }).lean()
    },

    findCouponById: (id: string) => {
        return couponModel.findOne({ _id: id, isDeleted: false }).lean()
    },

    findCouponByCode: (code: string) => {
        return couponModel.findOne({ code: code.toUpperCase().trim(), isDeleted: false }).lean()
    },

    createCoupon: (payload: Record<string, unknown>) => {
        return couponModel.create(payload)
    },

    updateCouponById: (id: string, payload: Record<string, unknown>) => {
        return couponModel.findOneAndUpdate({ _id: id, isDeleted: false }, payload, { new: true })
    },

    deleteCouponById: (id: string) => {
        return couponModel.findOneAndUpdate({ _id: id, isDeleted: false }, { isDeleted: true }, { new: true })
    },

    incrementUsedCount: (id: string) => {
        return couponModel.findByIdAndUpdate(id, { $inc: { used_count: 1 } }, { new: true })
    }
}
