import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Put,
    UseGuards,
    Query,
    ParseEnumPipe,
    Delete,
    ParseIntPipe,
    NotFoundException,
} from '@nestjs/common'
import { OrdersService } from './orders.service'
import { CreateOrderDto } from './dto/create-order.dto'
import { UpdateOrderDto } from './dto/update-order.dto'
import { LoggedInGuard } from 'src/auth/loggedIn.guard'
import { Prisma } from '@prisma/client'
import {
    makeValidRequestPagination,
    requestPaginationToOffset,
    makePaginatedResponse,
} from 'src/Common/utils'
import { EOrderStatus } from 'src/Common/types'
import { AllowEmptyPipe } from 'src/Common/allow-empty.pipe'

@Controller('orders')
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) {}

    @Post()
    async create(@Body() createOrderDto: CreateOrderDto) {
        const order = await this.ordersService.create(createOrderDto)
        return { id: order.id }
    }

    @Get()
    @UseGuards(LoggedInGuard)
    async getPaginated(
        @Query('query') queryString?: string,
        @Query('page') page?: string,
        @Query('perPage') perPage?: string,
        @Query('startDate') startDate?: string,
        @Query('endDate') endDate?: string,
        @Query('status', new AllowEmptyPipe(new ParseEnumPipe(EOrderStatus)))
        status?: EOrderStatus,
        @Query(
            'sortByDate',
            new AllowEmptyPipe(new ParseEnumPipe(Prisma.SortOrder)),
        )
        sortByDate?: Prisma.SortOrder,
    ) {
        const requestPagination = makeValidRequestPagination({ page, perPage })
        const products = await this.ordersService.findSome(
            requestPaginationToOffset(requestPagination),
            requestPagination.perPage,
            queryString,
            startDate,
            endDate,
            status,
            sortByDate,
        )
        return makePaginatedResponse(
            products.data,
            requestPagination,
            products.total,
        )
    }

    @Get(':id')
    @UseGuards(LoggedInGuard)
    async findOne(@Param('id', ParseIntPipe) id: number) {
        const order = await this.ordersService.findOne(id)
        if (!order) {
            throw new NotFoundException('Order not found')
        }
        console.log({ order })
        return order
    }

    @Put(':id')
    @UseGuards(LoggedInGuard)
    async update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateOrderDto: UpdateOrderDto,
    ) {
        return await this.ordersService.update(id, updateOrderDto)
    }

    @Delete(':id')
    @UseGuards(LoggedInGuard)
    async remove(@Param('id', ParseIntPipe) id: number) {
        return await this.ordersService.remove(id)
    }
}
