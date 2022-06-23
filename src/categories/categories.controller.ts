import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    Put,
    UseGuards,
    NotFoundException,
} from '@nestjs/common'
import { PrismaError } from 'prisma-error-enum'
import { LoggedInGuard } from 'src/auth/loggedIn.guard'
import { TPrismaErrorMap } from 'src/Common/types'
import { handleKnownPrismaErrors } from 'src/Common/utils'
import { CategoriesService } from './categories.service'
import { CreateCategoryDto } from './dto/create-category.dto'
import { UpdateCategoryDto } from './dto/update-category.dto'

const PRISMA_ERROR_MAP: TPrismaErrorMap = {
    [PrismaError.RecordsNotFound]: new NotFoundException(
        'Category does not exist',
    ),
}

@Controller('categories')
@UseGuards(LoggedInGuard)
export class CategoriesController {
    constructor(private readonly categoriesService: CategoriesService) {}

    @Post()
    async create(@Body() createCategoryDto: CreateCategoryDto) {
        const category = await this.categoriesService.create(createCategoryDto)
        return { id: category.id }
    }

    @Get()
    findAll() {
        return this.categoriesService.findAll()
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() updateCategoryDto: UpdateCategoryDto,
    ) {
        await this.categoriesService
            .update(+id, updateCategoryDto)
            .catch(handleKnownPrismaErrors(PRISMA_ERROR_MAP))
    }

    @Delete(':id')
    async remove(@Param('id') id: string) {
        await this.categoriesService
            .remove(+id)
            .catch(handleKnownPrismaErrors(PRISMA_ERROR_MAP))
    }
}
