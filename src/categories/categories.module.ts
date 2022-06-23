import { Module } from '@nestjs/common'
import { CategoriesService } from './categories.service'
import { CategoriesController } from './categories.controller'
import { PrismaService } from 'src/Common/prisma.service'
import { ProductsService } from 'src/products/products.service'

@Module({
    controllers: [CategoriesController],
    providers: [PrismaService, ProductsService, CategoriesService],
})
export class CategoriesModule {}
