import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import moment from 'moment'
import { PrismaService } from 'src/Common/prisma.service'
import { EOrderStatus } from 'src/Common/types'
import { CreateOrderDto } from './dto/create-order.dto'
import { UpdateOrderDto } from './dto/update-order.dto'

@Injectable()
export class OrdersService {
    constructor(private readonly prismaService: PrismaService) {}

    create(createOrderDto: CreateOrderDto) {
        return this.prismaService.$transaction(async (prisma) => {
            const products = await prisma.product.findMany({
                where: {
                    id: { in: createOrderDto.products.map((p) => p.productId) },
                },
            })
            if (
                products.some(
                    (p, i) => p.available < createOrderDto.products[i].count,
                )
            ) {
                throw new Error('Trying to over-reserve products')
            }
            await Promise.all(
                createOrderDto.products.map((product) =>
                    prisma.product.update({
                        where: { id: product.productId },
                        data: { available: { decrement: product.count } },
                    }),
                ),
            )
            return prisma.order.create({
                data: {
                    ...createOrderDto,
                    products: {
                        create: createOrderDto.products.map((product) => ({
                            count: product.count,
                            productId: product.productId,
                        })),
                    },
                },
            })
        })
    }

    async findSome(
        offset: number,
        count: number,
        queryString?: string,
        startDate?: string,
        endDate?: string,
        status?: EOrderStatus,
        sortByDate?: Prisma.SortOrder,
    ) {
        const where: Prisma.OrderWhereInput = queryString
            ? {
                  OR: [
                      { comment: { contains: queryString } },
                      { shippingAddress: { contains: queryString } },
                      { contactInfo: { contains: queryString } },
                      {
                          products: {
                              some: {
                                  product: { name: { contains: queryString } },
                              },
                          },
                      },
                  ],
                  createdAt: {
                      gte: startDate ? moment(startDate).toDate() : undefined,
                      lte: endDate ? moment(endDate).toDate() : undefined,
                  },
                  status,
              }
            : {}
        const [data, total] = await this.prismaService.$transaction([
            this.prismaService.order.findMany({
                skip: offset,
                take: count,
                where,
                orderBy: sortByDate
                    ? {
                          createdAt: sortByDate,
                      }
                    : undefined,
            }),
            this.prismaService.order.count({ where }),
        ])
        return { data, total }
    }

    findOne(id: number) {
        return this.prismaService.order.findFirst({
            where: { id },
            include: {
                products: { select: { count: true, productId: true } },
            },
        })
    }

    async update(id: number, updateOrderDto: UpdateOrderDto) {
        const order = await this.prismaService.order.findFirst({
            where: { id },
        })
        if (
            [EOrderStatus.COMPLETED, EOrderStatus.REJECTED].includes(
                order.status as EOrderStatus,
            )
        ) {
            throw new Error("Can't modify completed or rejected orders")
        }

        const newProductIds = updateOrderDto.products.map((p) => p.productId)

        await this.prismaService.$transaction(async (prisma) => {
            // Remove reservation from products, which are no longer linked to this order
            const productsToRemove = await prisma.productsOnOrders.findMany({
                where: {
                    orderId: id,
                    productId: { notIn: newProductIds },
                },
                select: { productId: true, count: true },
            })
            await Promise.all(
                productsToRemove.map((p) =>
                    prisma.product.update({
                        where: { id: p.productId },
                        data: {
                            available: { increment: p.count },
                        },
                    }),
                ),
            )

            // Update reservations on products, which are linked to this order
            const productsToBeLinked = await prisma.product.findMany({
                where: {
                    id: { in: newProductIds },
                },
            })
            const alreadyLinkedProducts =
                await prisma.productsOnOrders.findMany({
                    where: {
                        orderId: id,
                        productId: { in: newProductIds },
                    },
                })
            const availabilityChanges = updateOrderDto.products.map(
                (product) =>
                    alreadyLinkedProducts.find(
                        (linkedProduct) =>
                            linkedProduct.productId === product.productId,
                    ).count - product.count,
            )
            if (
                productsToBeLinked.some(
                    (p, i) => p.available + availabilityChanges[i] < p.count,
                )
            ) {
                throw new Error('Trying to over-reserve products')
            }
            await Promise.all(
                updateOrderDto.products.map((product, i) => {
                    const change = availabilityChanges[i]
                    if (!change) return null
                    return prisma.product.update({
                        where: { id: product.productId },
                        data: {
                            available: {
                                increment: change > 0 ? change : undefined,
                                decrement: change < 0 ? change : undefined,
                            },
                        },
                    })
                }),
            )

            // Update order
            await prisma.order.update({
                where: { id },
                data: {
                    ...updateOrderDto,
                    products: {
                        // Delete rows from join table
                        deleteMany: {
                            productId: { notIn: newProductIds },
                        },
                        // Add or update rows in join table
                        upsert: updateOrderDto.products.map((p) => ({
                            where: {
                                productId_orderId: {
                                    orderId: id,
                                    productId: p.productId,
                                },
                            },
                            update: { count: p.count },
                            create: { count: p.count, productId: p.productId },
                        })),
                    },
                },
            })
        })
    }

    async changeStatus(id: number, status: EOrderStatus) {
        const order = await this.prismaService.order.findFirst({
            where: { id },
        })
        if (order.status === status) {
            return
        }
        if (status === EOrderStatus.CREATED) {
            throw new Error('Invalid status transition')
        }
        if (order.status === EOrderStatus.COMPLETED) {
            throw new Error('Invalid status transition')
        }
        if (
            status === EOrderStatus.COMPLETED &&
            order.status !== EOrderStatus.ACCEPTED
        ) {
            throw new Error('Invalid status transition')
        }
        return this.prismaService.$transaction(async (prisma) => {
            const linkedProducts = await prisma.productsOnOrders.findMany({
                where: { orderId: id },
            })

            switch (status) {
                case EOrderStatus.REJECTED:
                    await Promise.all(
                        linkedProducts.map((linkedProduct) =>
                            prisma.product.update({
                                where: { id: linkedProduct.productId },
                                data: {
                                    available: {
                                        increment: linkedProduct.count,
                                    },
                                },
                            }),
                        ),
                    )
                    break

                case EOrderStatus.ACCEPTED:
                    if (order.status === EOrderStatus.CREATED) break
                    const products = await prisma.product.findMany({
                        where: {
                            id: { in: linkedProducts.map((p) => p.productId) },
                        },
                    })
                    if (
                        products.some(
                            ({ id, available }) =>
                                available <
                                linkedProducts.find((p) => p.productId === id)
                                    .count,
                        )
                    ) {
                        throw new Error('Trying to over-reserve products')
                    }
                    await Promise.all(
                        linkedProducts.map((linkedProduct) =>
                            prisma.product.update({
                                where: { id: linkedProduct.productId },
                                data: {
                                    available: {
                                        decrement: linkedProduct.count,
                                    },
                                },
                            }),
                        ),
                    )
                    break

                case EOrderStatus.COMPLETED:
                    await Promise.all(
                        linkedProducts.map((linkedProduct) =>
                            prisma.product.update({
                                where: { id: linkedProduct.productId },
                                data: {
                                    count: {
                                        decrement: linkedProduct.count,
                                    },
                                },
                            }),
                        ),
                    )
                    break
            }

            return prisma.order.update({
                where: { id },
                data: { status },
            })
        })
    }

    async remove(id: number) {
        await this.prismaService.$transaction(async (prisma) => {
            const order = await prisma.order.findFirst({ where: { id } })
            if (
                [EOrderStatus.CREATED, EOrderStatus.ACCEPTED].includes(
                    order.status as EOrderStatus,
                )
            ) {
                const products = await prisma.productsOnOrders.findMany({
                    where: { orderId: id },
                    select: { productId: true, count: true },
                })
                await Promise.all(
                    products.map((p) =>
                        prisma.product.update({
                            where: { id: p.productId },
                            data: {
                                available: { increment: p.count },
                            },
                        }),
                    ),
                )
            }
            await prisma.productsOnOrders.deleteMany({
                where: { orderId: id },
            })
            await prisma.order.delete({
                where: { id },
            })
        })
    }
}
