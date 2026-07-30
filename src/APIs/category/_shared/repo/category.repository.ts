import categoryModel from '../models/category.model'

export default {
    findAllCategories: (filter: { isActive?: boolean } = {}) => {
        const query: Record<string, unknown> = {}
        if (filter.isActive !== undefined) {
            query.isActive = filter.isActive
        } else {
            query.isActive = true
        }
        return categoryModel.find(query).sort({ displayOrder: 1, createdAt: 1 }).lean()
    },

    findCategoryById: (id: string) => {
        return categoryModel.findById(id).lean()
    },

    findCategoryByName: (name: string) => {
        return categoryModel.findOne({ name }).lean()
    },

    createCategory: (payload: { name: string; displayOrder?: number; isActive?: boolean }) => {
        return categoryModel.create(payload)
    },

    updateCategoryById: (id: string, payload: { name?: string; displayOrder?: number; isActive?: boolean }) => {
        return categoryModel.findByIdAndUpdate(id, payload, { new: true })
    },

    deleteCategoryById: (id: string) => {
        return categoryModel.findByIdAndUpdate(id, { isActive: false }, { new: true })
    }
}