import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from 'src/Common/prisma.service'
import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'

@Injectable()
export class ProductsService {
    constructor(private readonly prismaService: PrismaService) {}

    create(createProductDto: CreateProductDto) {
        console.log({ createProductDto })
        return this.prismaService.product.create({
            data: {
                ...createProductDto,
                available: createProductDto.count,
            },
        })
    }

    async findSome(
        offset: number,
        count: number,
        queryString?: string,
        categoryId?: number,
        sortByPrice?: Prisma.SortOrder,
        onlyInStock?: boolean,
        findHidden?: boolean,
    ) {
        const where: Prisma.ProductWhereInput = {
            OR: queryString
                ? [
                      { name: { contains: queryString } },
                      { description: { contains: queryString } },
                  ]
                : undefined,
            available: onlyInStock ? { gt: 0 } : undefined,
            categoryId,
            isHidden: findHidden ? undefined : false,
        }
        const [data, total] = await Promise.all([
            this.prismaService.product.findMany({
                skip: offset,
                take: count,
                where,
                orderBy: sortByPrice ? { price: sortByPrice } : undefined,
                select: {
                    description: false,
                    id: true,
                    name: true,
                    price: true,
                    imageUrl: true,
                    count: true,
                    available: true,
                    categoryId: true,
                    isHidden: true,
                },
            }),
            this.prismaService.product.count({ where }),
        ])
        return { data, total }
    }

    async findOne(id: number, findHidden = false) {
        const product = await this.prismaService.product.findFirst({
            where: {
                id,
                isHidden: findHidden ? undefined : false,
            },
            include: { orders: true },
        })
        if (!product) return null
        const reserved = product.orders.reduce(
            (sum, order) => sum + order.count,
            0,
        )
        delete product.orders
        return { ...product, available: product.count - reserved }
    }

    update(id: number, updateProductDto: UpdateProductDto) {
        return this.prismaService.product.update({
            where: { id },
            data: updateProductDto,
        })
    }

    changeVisibility(id: number, newIsHidden: boolean) {
        return this.prismaService.product.update({
            where: { id },
            data: { isHidden: newIsHidden },
        })
    }

    removeCategory(categoryId: number) {
        return this.prismaService.product.updateMany({
            where: { categoryId },
            data: { categoryId: null },
        })
    }
}
