import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    UseGuards,
    Put,
    Query,
    NotFoundException,
    Patch,
    ParseBoolPipe,
    DefaultValuePipe,
    ParseIntPipe,
    ParseEnumPipe,
} from '@nestjs/common'
import { ProductsService } from './products.service'
import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'
import { LoggedInGuard } from 'src/auth/loggedIn.guard'
import {
    makeValidRequestPagination,
    requestPaginationToOffset,
    makePaginatedResponse,
    arrOmit,
    handleKnownPrismaErrors,
} from 'src/Common/utils'
import { Prisma } from '@prisma/client'
import { PrismaError } from 'prisma-error-enum'
import { TPrismaErrorMap } from 'src/Common/types'

const PRISMA_ERROR_MAP: TPrismaErrorMap = {
    [PrismaError.RecordsNotFound]: new NotFoundException(
        'Product does not exist',
    ),
}

@Controller('products')
export class ProductsController {
    constructor(private readonly productsService: ProductsService) {}

    @Post()
    @UseGuards(LoggedInGuard)
    create(@Body() createProductDto: CreateProductDto) {
        return this.productsService.create(createProductDto)
    }

    @Get()
    async getPaginated(
        @Query('onlyInStock', new DefaultValuePipe(false), ParseBoolPipe)
        onlyInStock: boolean,
        @Query('query') queryString?: string,
        @Query('page') page?: string,
        @Query('perPage') perPage?: string,
        @Query('category') categoryId?: string,
        @Query('sortByPrice') sortByPrice?: string,
    ) {
        const requestPagination = makeValidRequestPagination({ page, perPage })
        const products = await this.productsService.findSome(
            requestPaginationToOffset(requestPagination),
            requestPagination.perPage,
            queryString,
            Number(categoryId) || null,
            Object.keys(Prisma.SortOrder).includes(sortByPrice)
                ? (sortByPrice as Prisma.SortOrder)
                : undefined,
            onlyInStock,
            false,
        )
        return makePaginatedResponse(
            arrOmit(products.data, ['isHidden', 'count']),
            requestPagination,
            products.total,
        )
    }

    @Get('admin-list')
    @UseGuards(LoggedInGuard)
    async getPaginatedForAdmin(
        @Query('onlyInStock', new DefaultValuePipe(false), ParseBoolPipe)
        onlyInStock: boolean,
        @Query('showHidden', new DefaultValuePipe(true), ParseBoolPipe)
        findHidden: boolean,
        @Query('query') queryString?: string,
        @Query('page') page?: string,
        @Query('perPage') perPage?: string,
        @Query('category') categoryId?: string,
        @Query('sortByPrice', new ParseEnumPipe(Prisma.SortOrder))
        sortByPrice?: Prisma.SortOrder,
    ) {
        const requestPagination = makeValidRequestPagination({ page, perPage })
        const products = await this.productsService.findSome(
            requestPaginationToOffset(requestPagination),
            requestPagination.perPage,
            queryString,
            Number(categoryId) || null,
            Object.keys(Prisma.SortOrder).includes(sortByPrice)
                ? sortByPrice
                : undefined,
            onlyInStock,
            findHidden,
        )
        return makePaginatedResponse(
            products.data,
            requestPagination,
            products.total,
        )
    }

    @Get(':id')
    detail(@Param('id', ParseIntPipe) id: number) {
        return this.productsService
            .findOne(id)
            .then((product) => {
                delete product.count
                delete product.isHidden
                return product
            })
            .catch(handleKnownPrismaErrors(PRISMA_ERROR_MAP))
    }

    @Get('admin-detail/:id')
    adminDetail(@Param('id', ParseIntPipe) id: number) {
        return this.productsService
            .findOne(id)
            .catch(handleKnownPrismaErrors(PRISMA_ERROR_MAP))
    }

    @Put(':id')
    @UseGuards(LoggedInGuard)
    async update(
        @Param('id') id: string,
        @Body() updateProductDto: UpdateProductDto,
    ) {
        await this.productsService
            .update(+id, updateProductDto)
            .catch(handleKnownPrismaErrors(PRISMA_ERROR_MAP))
    }

    @Patch(':id/hide')
    @UseGuards(LoggedInGuard)
    async hide(@Param('id') id: string) {
        await this.productsService
            .changeVisibility(+id, false)
            .catch(handleKnownPrismaErrors(PRISMA_ERROR_MAP))
    }

    @Patch(':id/show')
    @UseGuards(LoggedInGuard)
    async show(@Param('id') id: string) {
        await this.productsService
            .changeVisibility(+id, true)
            .catch(handleKnownPrismaErrors(PRISMA_ERROR_MAP))
    }
}
