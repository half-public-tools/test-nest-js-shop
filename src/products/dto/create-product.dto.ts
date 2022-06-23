import { Category, Prisma } from '@prisma/client'
import {
    Allow,
    IsNotEmpty,
    IsNumber,
    IsPositive,
    IsString,
} from 'class-validator'

type TCreateProductDto = Omit<
    Prisma.ProductCreateInput,
    'category' | 'available'
> & {
    categoryId?: Category['id']
}

export class CreateProductDto implements TCreateProductDto {
    @IsString()
    @IsNotEmpty()
    name: string

    @IsString()
    description: string

    @Allow()
    imageUrl?: string

    @IsNumber()
    @IsPositive()
    price: number

    @IsNumber()
    @IsPositive()
    count: number

    @Allow()
    categoryId?: number
}
