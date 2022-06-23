import { Module } from '@nestjs/common'
import { ProductsService } from './products.service'
import { ProductsController } from './products.controller'
import { PrismaService } from 'src/Common/prisma.service'

@Module({
    controllers: [ProductsController],
    providers: [PrismaService, ProductsService],
})
export class ProductsModule {}
