import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/Common/prisma.service'
import { ProductsService } from 'src/products/products.service'
import { CreateCategoryDto } from './dto/create-category.dto'
import { UpdateCategoryDto } from './dto/update-category.dto'

@Injectable()
export class CategoriesService {
    constructor(
        private readonly prismaService: PrismaService,
        private readonly productsService: ProductsService,
    ) {}

    create(createCategoryDto: CreateCategoryDto) {
        return this.prismaService.category.create({ data: createCategoryDto })
    }

    async findAll() {
        const categories = await this.prismaService.category.findMany({
            include: { _count: true },
        })
        return categories.map((cat) => {
            const products = cat._count.Product
            delete cat._count
            return { ...cat, products }
        })
    }

    update(id: number, updateCategoryDto: UpdateCategoryDto) {
        return this.prismaService.category.update({
            where: { id },
            data: updateCategoryDto,
        })
    }

    async remove(id: number) {
        await this.productsService.removeCategory(id)
        return this.prismaService.category.delete({ where: { id } })
    }
}
