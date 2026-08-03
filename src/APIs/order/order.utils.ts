import mongoose from 'mongoose'
import productRepository from '../product/_shared/repo/product.repository'
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
}

export const calculateOrderTotal = async (items: Array<{
    productId: string
    quantity: number
    customizations?: Array<{
        groupId: string
        groupTitle: string
        options: Array<{ id: string; name: string; priceAdd: number }>
    }>
}>): Promise<CalculatedOrder> => {
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

    const tax = subtotal * 0.10
    const total = subtotal + tax

    return {
        items: calculatedItems,
        subtotal,
        tax,
        total
    }
}