import responseMessage from '../../constant/responseMessage'
import { CustomError } from '../../utils/errors'
import categoryRepository from '../category/_shared/repo/category.repository'
import { ICreateCategoryBody, IUpdateCategoryBody } from './category.interface'

export const createCategory = async (payload: ICreateCategoryBody) => {
    const existingCategory = await categoryRepository.findCategoryByName(payload.name)
    if (existingCategory) {
        throw new CustomError(responseMessage.NOT_FOUND('Category'), 422)
    }

    const category = await categoryRepository.createCategory({
        name: payload.name,
        displayOrder: payload.displayOrder || 0,
        isActive: payload.isActive !== undefined ? payload.isActive : true
    })

    return {
        success: true,
        category
    }
}

export const getAllCategories = async () => {
    const categories = await categoryRepository.findAllCategories()

    return {
        success: true,
        categories
    }
}

export const getCategoryById = async (id: string) => {
    const category = await categoryRepository.findCategoryById(id)
    if (!category) {
        throw new CustomError(responseMessage.NOT_FOUND('Category'), 404)
    }

    return {
        success: true,
        category
    }
}

export const updateCategory = async (id: string, payload: IUpdateCategoryBody) => {
    const category = await categoryRepository.findCategoryById(id)
    if (!category) {
        throw new CustomError(responseMessage.NOT_FOUND('Category'), 404)
    }

    if (payload.name && payload.name !== category.name) {
        const existingCategory = await categoryRepository.findCategoryByName(payload.name)
        if (existingCategory) {
            throw new CustomError(responseMessage.NOT_FOUND('Category'), 422)
        }
    }

    const updatedCategory = await categoryRepository.updateCategoryById(id, payload)
    if (!updatedCategory) {
        throw new CustomError(responseMessage.NOT_FOUND('Category'), 404)
    }

    return {
        success: true,
        category: updatedCategory
    }
}

export const deleteCategory = async (id: string) => {
    const category = await categoryRepository.findCategoryById(id)
    if (!category) {
        throw new CustomError(responseMessage.NOT_FOUND('Category'), 404)
    }

    const deletedCategory = await categoryRepository.deleteCategoryById(id)
    if (!deletedCategory) {
        throw new CustomError(responseMessage.NOT_FOUND('Category'), 404)
    }

    return {
        success: true,
        message: responseMessage.SUCCESS
    }
}