import { PrismaClientKnownRequestError } from '@prisma/client/runtime'
import { DEFAULT_REQUEST_PAGINATION } from './consts'
import {
    IPaginatedListResponse,
    IRequestPagination,
    TPrismaErrorMap,
    TPrismaRequestError,
} from './types'

export const handleKnownPrismaErrors =
    (
        errorMap: TPrismaErrorMap,
        otherCasesHandler?: (err: PrismaClientKnownRequestError) => void,
    ) =>
    (err: TPrismaRequestError) => {
        if ('code' in err) {
            if (errorMap[err.code]) {
                throw errorMap[err.code]
            } else if (otherCasesHandler) {
                otherCasesHandler(err)
            }
        }
        throw err
    }

export const makeValidRequestPagination = <
    T extends Partial<Record<keyof IRequestPagination, string | number>>,
>({
    page,
    perPage,
}: T): IRequestPagination => {
    let _page = Number(page)
    if (_page < 1) _page = null
    let _perPage = Number(perPage)
    if (_perPage < 1) _perPage = null
    return {
        page: _page || DEFAULT_REQUEST_PAGINATION.page,
        perPage: _perPage ?? DEFAULT_REQUEST_PAGINATION.perPage,
    }
}

export const requestPaginationToOffset = ({
    page,
    perPage,
}: IRequestPagination): number => (page - 1) * perPage

export const makePaginatedResponse = <T>(
    data: T[],
    requestPagination: IRequestPagination,
    total: number,
): IPaginatedListResponse<T> => ({
    data,
    pagination: {
        ...requestPagination,
        total,
    },
})

export const arrOmit = <T, K extends keyof T>(
    arr: T[],
    keys: K | K[],
): Omit<T, K>[] =>
    arr.map((el) => {
        if (Array.isArray(keys)) {
            keys.forEach((key) => delete el[key])
        } else {
            delete el[keys]
        }
        return el
    })
