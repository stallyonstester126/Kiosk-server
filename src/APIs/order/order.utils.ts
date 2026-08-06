import mongoose from 'mongoose'
import productRepository from '../product/_shared/repo/product.repository'
import couponRepository from '../coupon/_shared/repo/coupon.repository'
import { validateCouponHelper } from '../coupon/coupon.service'
import { CustomError } from '../../utils/errors'

export interface CalculatedOrderItem {
    productId: mongoose.Types.ObjectId
    name: string
    quantity: number
    basePrice: number
    customizations: Array<{
        groupId: string
        groupTitle: string
        options: Array<{ id: string; name: string; priceAdd: number }>
    }>
}

export interface CalculatedOrder {
    items: CalculatedOrderItem[]
    subtotal: number
    tax: number
    total: number
    couponId: mongoose.Types.ObjectId | string | null
    couponCode: string | null
    discountType: string | null
    discountValue: number
    discountAmount: number
    subtotalBeforeDiscount: number
    subtotalAfterDiscount: number
    taxAfterDiscount: number
    grandTotal: number
}

export const calculateOrderTotal = async (
    items: Array<{
        productId: string
        quantity: number
        customizations?: Array<{
            groupId: string
            groupTitle: string
            options: Array<{ id: string; name: string; priceAdd: number }>
        }>
    }>,
    couponCode?: string,
    customerName?: string
): Promise<CalculatedOrder> => {
    let subtotal = 0
    const calculatedItems: CalculatedOrderItem[] = []

    for (const item of items) {
        if (!mongoose.Types.ObjectId.isValid(item.productId)) {
            throw new CustomError('Invalid product ID', 422)
        }

        const product = await productRepository.findProductById(item.productId)
        if (!product) {
            throw new CustomError(`Product ${item.productId} not found`, 404)
        }
        if (!product.isActive) {
            throw new CustomError(`Product ${item.productId} is inactive`, 422)
        }

        let itemPrice = product.price
        const validatedCustomizations: CalculatedOrderItem['customizations'] = []

        for (const customGroup of item.customizations || []) {
            const productGroup = product.customizations?.find((g) => g.id === customGroup.groupId)
            if (!productGroup) {
                throw new CustomError(`Invalid customization group: ${customGroup.groupId}`, 422)
            }

            const validatedOptions: CalculatedOrderItem['customizations'][0]['options'] = []

            for (const selectedOption of customGroup.options) {
                const productOption = productGroup.options.find((o) => o.id === selectedOption.id)
                if (!productOption) {
                    throw new CustomError(`Invalid customization option: ${selectedOption.id}`, 422)
                }
                validatedOptions.push({
                    id: productOption.id,
                    name: productOption.name,
                    priceAdd: productOption.priceAdd
                })
                itemPrice += productOption.priceAdd
            }

            validatedCustomizations.push({
                groupId: customGroup.groupId,
                groupTitle: customGroup.groupTitle,
                options: validatedOptions
            })
        }

        if (item.quantity <= 0) {
            throw new CustomError('Quantity must be greater than 0', 422)
        }

        const lineTotal = itemPrice * item.quantity
        subtotal += lineTotal

        calculatedItems.push({
            productId: new mongoose.Types.ObjectId(item.productId),
            name: product.name,
            quantity: item.quantity,
            basePrice: itemPrice,
            customizations: validatedCustomizations
        })
    }

    let discountAmount = 0
    let couponId: mongoose.Types.ObjectId | string | null = null
    let finalCouponCode: string | null = null
    let discountType: string | null = null
    let discountValue = 0

    if (couponCode) {
        const cleanedCode = couponCode.trim().toUpperCase()
        const coupon = await couponRepository.findCouponByCode(cleanedCode)
        if (!coupon) {
            throw new CustomError('Invalid coupon code', 422)
        }
        
        const validation = await validateCouponHelper(coupon as any, subtotal, customerName)
        if (!validation.valid) {
            throw new CustomError(validation.reason || 'Invalid coupon', 422)
        }
        
        discountAmount = validation.discountAmount ?? 0
        couponId = coupon._id as mongoose.Types.ObjectId
        finalCouponCode = coupon.code
        discountType = coupon.discount_type
        discountValue = coupon.discount_type === 'percentage' ? (coupon.percentage ?? 0) : (coupon.fixed_amount ?? 0)
    }

    const subtotalAfterDiscount = Math.round((subtotal - discountAmount) * 100) / 100
    const taxAfterDiscount = Math.round((subtotalAfterDiscount * 0.10) * 100) / 100
    const grandTotal = Math.round((subtotalAfterDiscount + taxAfterDiscount) * 100) / 100

    return {
        items: calculatedItems,
        subtotal: subtotal,
        tax: taxAfterDiscount,
        total: grandTotal,
        couponId,
        couponCode: finalCouponCode,
        discountType,
        discountValue,
        discountAmount,
        subtotalBeforeDiscount: subtotal,
        subtotalAfterDiscount,
        taxAfterDiscount,
        grandTotal
    }
}