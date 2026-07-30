import responseMessage from '../../../constant/responseMessage'
import { CustomError } from '../../../utils/errors'
import categoryRepository from '../_shared/repo/category.repository'

export default {
    categoryAlreadyExists: async (name: string) => {
        const category = await categoryRepository.findCategoryByName(name)
        if (category) {
            throw new CustomError(responseMessage.NOT_FOUND('Category'), 422)
        }
        return
    },
    categoryNotFound: async (id: string) => {
        const category = await categoryRepository.findCategoryById(id)
        if (!category) {
            throw new CustomError(responseMessage.NOT_FOUND('Category'), 404)
        }
        return
    }
}