import { Prisma, Product } from '@prisma/client'
import { Type } from 'class-transformer'
import {
    Allow,
    IsArray,
    IsNotEmpty,
    IsPositive,
    IsString,
    ValidateNested,
} from 'class-validator'

type TCreateOrderProduct = Omit<
    Prisma.ProductsOnOrdersCreateInput,
    'product' | 'order'
> & {
    productId: Product['id']
}

export class ProductInOrder implements TCreateOrderProduct {
    @Allow()
    @IsPositive()
    productId: number

    @Allow()
    @IsPositive()
    count: number
}

type TCreateOrderDTO = Prisma.OrderCreateInput & {
    products: ProductInOrder[]
}

export class CreateOrderDto implements TCreateOrderDTO {
    @IsString()
    @IsNotEmpty()
    shippingAddress: string

    @IsString()
    @IsNotEmpty()
    comment: string

    @IsString()
    @IsNotEmpty()
    contactInfo: string

    @IsArray()
    @ValidateNested()
    @Type(() => ProductInOrder)
    products: ProductInOrder[]
}
