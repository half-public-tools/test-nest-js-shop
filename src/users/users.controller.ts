import {
    Controller,
    Get,
    Post,
    Body,
    Param,
    Delete,
    Put,
    Query,
    BadRequestException,
    UseGuards,
    Request,
    ConflictException,
    NotFoundException,
} from '@nestjs/common'
import { UsersService } from './users.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { LoggedInGuard } from 'src/auth/loggedIn.guard'
import { TPrismaErrorMap } from 'src/Common/types'
import { PrismaError } from 'prisma-error-enum'
import {
    arrOmit,
    handleKnownPrismaErrors,
    makePaginatedResponse,
    makeValidRequestPagination,
    requestPaginationToOffset,
} from 'src/Common/utils'

const PRISMA_ERROR_MAP: TPrismaErrorMap = {
    [PrismaError.RecordsNotFound]: new NotFoundException('User does not exist'),
}

@Controller('users')
@UseGuards(LoggedInGuard)
export class UsersController {
    constructor(private readonly usersService: UsersService) {}

    @Post()
    async create(@Body() createUserDto: CreateUserDto) {
        const user = await this.usersService.create(createUserDto).catch(
            handleKnownPrismaErrors(PRISMA_ERROR_MAP, (err) => {
                if (
                    err.code === PrismaError.UniqueConstraintViolation &&
                    err.meta?.target[0] === 'username'
                ) {
                    throw new BadRequestException('Username is taken')
                }
            }),
        )
        return { id: user.id }
    }

    @Get()
    async getPaginated(
        @Query('query') queryString?: string,
        @Query('page') page?: string,
        @Query('perPage') perPage?: string,
    ) {
        const requestPagination = makeValidRequestPagination({ page, perPage })
        const users = await this.usersService.findSome(
            requestPaginationToOffset(requestPagination),
            requestPagination.perPage,
            queryString,
        )
        return makePaginatedResponse(
            arrOmit(users.data, 'password'),
            requestPagination,
            users.total,
        )
    }

    @Get('self')
    async getSelf(@Request() req) {
        delete req.user.password
        return req.user
    }

    @Get(':id')
    async getById(@Param('id') id: string) {
        const user = await this.usersService
            .findOne(+id)
            .catch(handleKnownPrismaErrors(PRISMA_ERROR_MAP))
        delete user.password
        return user
    }

    @Put(':id')
    async update(
        @Param('id') id: string,
        @Body() updateUserDto: UpdateUserDto,
    ) {
        await this.usersService.update(+id, updateUserDto).catch(
            handleKnownPrismaErrors(PRISMA_ERROR_MAP, (err) => {
                if (
                    err.code === PrismaError.UniqueConstraintViolation &&
                    err.meta?.target[0] === 'username'
                ) {
                    throw new BadRequestException('Username is taken')
                }
            }),
        )
    }

    @Delete(':id')
    async remove(@Request() req, @Param('id') id: string) {
        if (req.user.id === +id) {
            throw new ConflictException('Cannot delete current user')
        }
        await this.usersService
            .remove(+id)
            .catch(handleKnownPrismaErrors(PRISMA_ERROR_MAP))
    }
}
