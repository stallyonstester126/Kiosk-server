export interface ICategory {
    name: string
    displayOrder: number
    isActive: boolean
}

export interface ICategoryWithId extends ICategory {
    _id: string
    createdAt: Date
    updatedAt: Date
}

export interface ICreateCategoryBody {
    name: string
    displayOrder?: number
    isActive?: boolean
}

export interface IUpdateCategoryBody {
    name?: string
    displayOrder?: number
    isActive?: boolean
}