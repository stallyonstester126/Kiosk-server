import mongoose from 'mongoose'

export interface ICustomizationOption {
    id: string
    name: string
    priceAdd: number
    isActive: boolean
    displayOrder: number
}

export interface ICustomizationGroup {
    id: string
    title: string
    type: 'single' | 'multiple'
    required: boolean
    minSelections: number
    maxSelections?: number
    isActive: boolean
    displayOrder: number
    options: ICustomizationOption[]
}

export interface IProduct {
    name: string
    description?: string
    price: number
    category: mongoose.Types.ObjectId
    image: string
    isActive?: boolean
    customizations?: ICustomizationGroup[]
}

export interface IProductWithId extends IProduct {
    _id: mongoose.Types.ObjectId
    createdAt: Date
    updatedAt: Date
}

export interface ICreateProductBody {
    name: string
    description?: string
    price: number
    category: string
    image: string
    isActive?: boolean
    customizations?: ICustomizationGroup[]
}

export interface IUpdateProductBody {
    name?: string
    description?: string
    price?: number
    category?: string
    image?: string
    isActive?: boolean
    customizations?: ICustomizationGroup[]
}
