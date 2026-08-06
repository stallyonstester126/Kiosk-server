import couponRepository from './_shared/repo/coupon.repository'
import orderRepository from '../order/_shared/repo/order.repository'
import { CustomError } from '../../utils/errors'
import { ICoupon, ICreateCouponBody, IUpdateCouponBody } from './coupon.interface'

export const validateCouponHelper = async (
    coupon: ICoupon,
    subtotal: number,
    customerName?: string,
    currentDate: Date = new Date()
) => {
    // 1. Coupon active
    if (coupon.status !== 'active') {
        return { valid: false, reason: 'Coupon is inactive' }
    }

    // 2. Already started
    const startsAt = new Date(coupon.starts_at)
    if (startsAt > currentDate) {
        return { valid: false, reason: 'Coupon has not started yet' }
    }

    // 3. Not expired
    const expiresAt = new Date(coupon.expires_at)
    if (expiresAt < currentDate) {
        return { valid: false, reason: 'Coupon has expired' }
    }

    // 4. Usage limit not exceeded
    if (coupon.usage_limit !== null && coupon.usage_limit !== undefined) {
        if (coupon.used_count >= coupon.usage_limit) {
            return { valid: false, reason: 'Coupon usage limit has been reached' }
        }
    }

    // 5. Minimum order satisfied
    if (coupon.minimum_order !== null && coupon.minimum_order !== undefined) {
        if (subtotal < coupon.minimum_order) {
            return { valid: false, reason: `Minimum order amount of $${coupon.minimum_order.toFixed(2)} required` }
        }
    }

    // 6. Customer usage not exceeded
    if (coupon.per_customer_limit !== null && coupon.per_customer_limit !== undefined && customerName) {
        const trimmedName = customerName.trim().toLowerCase()
        const customerOrders = await orderRepository.findAllOrders()
        const customerUsageCount = customerOrders.filter(o => 
            o.customerName && o.customerName.trim().toLowerCase() === trimmedName &&
            o.coupon_code === coupon.code &&
            o.status !== 'cancelled'
        ).length

        if (customerUsageCount >= coupon.per_customer_limit) {
            return { valid: false, reason: 'You have reached the usage limit for this coupon' }
        }
    }

    // 7. First order rule satisfied
    if (coupon.first_order_only && customerName) {
        const trimmedName = customerName.trim().toLowerCase()
        const customerOrders = await orderRepository.findAllOrders()
        const hasPriorOrders = customerOrders.some(o => 
            o.customerName && o.customerName.trim().toLowerCase() === trimmedName &&
            o.status !== 'cancelled'
        )

        if (hasPriorOrders) {
            return { valid: false, reason: 'This coupon is only valid for your first order' }
        }
    }

    // Calculate discount
    let discountAmount = 0
    if (coupon.discount_type === 'percentage') {
        const pct = coupon.percentage ?? 0
        discountAmount = subtotal * (pct / 100)
        if (coupon.maximum_discount !== null && coupon.maximum_discount !== undefined) {
            if (discountAmount > coupon.maximum_discount) {
                discountAmount = coupon.maximum_discount
            }
        }
    } else {
        discountAmount = coupon.fixed_amount ?? 0
    }

    // Discount cannot exceed subtotal
    if (discountAmount > subtotal) {
        discountAmount = subtotal
    }

    // Round to 2 decimal places
    discountAmount = Math.round(discountAmount * 100) / 100

    const updatedSubtotal = Math.round((subtotal - discountAmount) * 100) / 100
    const updatedTax = Math.round((updatedSubtotal * 0.10) * 100) / 100
    const updatedTotal = Math.round((updatedSubtotal + updatedTax) * 100) / 100

    return {
        valid: true,
        discountAmount,
        updatedSubtotal,
        updatedTax,
        updatedTotal,
        coupon
    }
}

export const createCouponService = async (payload: ICreateCouponBody, userId: string) => {
    const code = payload.code.toUpperCase().trim()

    // Expiry must be after start date
    const start = new Date(payload.starts_at)
    const end = new Date(payload.expires_at)
    if (end <= start) {
        throw new CustomError('Expiry date must be after the start date', 422)
    }

    // Cannot create expired coupon
    if (end.getTime() <= Date.now()) {
        throw new CustomError('Cannot create an expired coupon', 422)
    }

    // Check discount type values
    if (payload.discount_type === 'percentage') {
        if (!payload.percentage || payload.percentage < 1 || payload.percentage > 100) {
            throw new CustomError('Percentage discount must be between 1 and 100', 422)
        }
    } else if (payload.discount_type === 'fixed') {
        if (payload.fixed_amount === undefined || payload.fixed_amount === null || payload.fixed_amount < 0) {
            throw new CustomError('Fixed discount amount cannot be negative', 422)
        }
    }

    if (payload.minimum_order !== undefined && payload.minimum_order !== null && payload.minimum_order < 0) {
        throw new CustomError('Minimum order cannot be negative', 422)
    }

    if (payload.usage_limit !== undefined && payload.usage_limit !== null && payload.usage_limit < 0) {
        throw new CustomError('Usage limit cannot be negative', 422)
    }

    // Check uniqueness
    const existing = await couponRepository.findCouponByCode(code)
    if (existing) {
        throw new CustomError('Coupon code already exists', 422)
    }

    const coupon = await couponRepository.createCoupon({
        ...payload,
        code,
        created_by: userId
    })

    return {
        success: true,
        data: coupon
    }
}

export const updateCouponService = async (id: string, payload: IUpdateCouponBody) => {
    const existingCoupon = await couponRepository.findCouponById(id)
    if (!existingCoupon) {
        throw new CustomError('Coupon not found', 404)
    }

    const start = new Date(payload.starts_at ?? existingCoupon.starts_at)
    const end = new Date(payload.expires_at ?? existingCoupon.expires_at)
    if (end <= start) {
        throw new CustomError('Expiry date must be after the start date', 422)
    }

    if (payload.code) {
        const code = payload.code.toUpperCase().trim()
        if (code !== existingCoupon.code) {
            const duplicate = await couponRepository.findCouponByCode(code)
            if (duplicate) {
                throw new CustomError('Coupon code already exists', 422)
            }
        }
    }

    if (payload.discount_type === 'percentage' || (!payload.discount_type && existingCoupon.discount_type === 'percentage')) {
        const percentage = payload.percentage !== undefined ? payload.percentage : existingCoupon.percentage
        if (!percentage || percentage < 1 || percentage > 100) {
            throw new CustomError('Percentage discount must be between 1 and 100', 422)
        }
    } else if (payload.discount_type === 'fixed' || (!payload.discount_type && existingCoupon.discount_type === 'fixed')) {
        const fixed = payload.fixed_amount !== undefined ? payload.fixed_amount : existingCoupon.fixed_amount
        if (fixed === undefined || fixed === null || fixed < 0) {
            throw new CustomError('Fixed discount amount cannot be negative', 422)
        }
    }

    if (payload.minimum_order !== undefined && payload.minimum_order !== null && payload.minimum_order < 0) {
        throw new CustomError('Minimum order cannot be negative', 422)
    }

    if (payload.usage_limit !== undefined && payload.usage_limit !== null && payload.usage_limit < 0) {
        throw new CustomError('Usage limit cannot be negative', 422)
    }

    const updated = await couponRepository.updateCouponById(id, payload as any)
    return {
        success: true,
        data: updated
    }
}

export const deleteCouponService = async (id: string) => {
    const deleted = await couponRepository.deleteCouponById(id)
    if (!deleted) {
        throw new CustomError('Coupon not found', 404)
    }
    return {
        success: true,
        data: deleted
    }
}

export const enableCouponService = async (id: string) => {
    const updated = await couponRepository.updateCouponById(id, { status: 'active' })
    if (!updated) {
        throw new CustomError('Coupon not found', 404)
    }
    return {
        success: true,
        data: updated
    }
}

export const disableCouponService = async (id: string) => {
    const updated = await couponRepository.updateCouponById(id, { status: 'inactive' })
    if (!updated) {
        throw new CustomError('Coupon not found', 404)
    }
    return {
        success: true,
        data: updated
    }
}

export const duplicateCouponService = async (id: string) => {
    const source = await couponRepository.findCouponById(id)
    if (!source) {
        throw new CustomError('Source coupon not found', 404)
    }

    let duplicateCode = `${source.code}-DUP`
    let counter = 1
    while (await couponRepository.findCouponByCode(duplicateCode)) {
        duplicateCode = `${source.code}-DUP${counter}`
        counter++
    }

    const duplicatedObj = {
        code: duplicateCode,
        description: source.description ? `Duplicate of ${source.code}: ${source.description}` : `Duplicate of ${source.code}`,
        discount_type: source.discount_type,
        percentage: source.percentage,
        fixed_amount: source.fixed_amount,
        minimum_order: source.minimum_order,
        maximum_discount: source.maximum_discount,
        usage_limit: source.usage_limit,
        used_count: 0,
        per_customer_limit: source.per_customer_limit,
        starts_at: source.starts_at,
        expires_at: source.expires_at,
        first_order_only: source.first_order_only,
        stackable: source.stackable,
        status: 'inactive', // Default duplicate to inactive as common practice
        created_by: source.created_by
    }

    const created = await couponRepository.createCoupon(duplicatedObj)
    return {
        success: true,
        data: created
    }
}

export const validateCouponService = async (code: string, subtotal: number, customerName?: string) => {
    const coupon = await couponRepository.findCouponByCode(code)
    if (!coupon) {
        return {
            success: true,
            data: { valid: false, reason: 'Invalid coupon code' }
        }
    }

    const validation = await validateCouponHelper(coupon, subtotal, customerName)
    return {
        success: true,
        data: validation
    }
}

export const getAllCouponsService = async (status?: string, discountType?: string) => {
    const filter: Record<string, unknown> = {}
    if (status) {
        if (status === 'expired') {
            filter.expires_at = { $lt: new Date() }
        } else {
            filter.status = status
        }
    }
    if (discountType) {
        filter.discount_type = discountType
    }

    const coupons = await couponRepository.findAllCoupons(filter)
    return {
        success: true,
        data: coupons
    }
}

export const getCouponByIdService = async (id: string) => {
    const coupon = await couponRepository.findCouponById(id)
    if (!coupon) {
        throw new CustomError('Coupon not found', 404)
    }
    return {
        success: true,
        data: coupon
    }
}
