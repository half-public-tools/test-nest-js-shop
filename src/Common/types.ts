import {
    PrismaClientKnownRequestError,
    PrismaClientUnknownRequestError,
    PrismaClientValidationError,
} from '@prisma/client/runtime'
import { PrismaError } from 'prisma-error-enum'

export type TPrismaRequestError =
    | PrismaClientKnownRequestError
    | PrismaClientUnknownRequestError
    | PrismaClientValidationError

export enum EOrderStatus {
    CREATED = 'CREATED',
    ACCEPTED = 'ACCEPTED',
    REJECTED = 'REJECTED',
    COMPLETED = 'COMPLETED',
}

export type TPrismaKnownErrorUnion =
    typeof PrismaError[keyof typeof PrismaError]

export type TPrismaErrorMap = {
    [key in TPrismaKnownErrorUnion]?: Error
}

export interface IRequestPagination {
    page: number
    perPage: number
}

export interface IResponsePagination extends IRequestPagination {
    total: number
}

export interface IPaginatedListResponse<T> {
    data: T[]
    pagination: IResponsePagination
}
