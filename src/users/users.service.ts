import { Injectable } from '@nestjs/common'
import { PrismaService } from 'src/Common/prisma.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'
import { hashSync } from 'bcrypt'
import { Prisma } from '@prisma/client'

@Injectable()
export class UsersService {
    constructor(private prismaService: PrismaService) {}

    create(createUserDto: CreateUserDto) {
        return this.prismaService.user.create({
            data: {
                ...createUserDto,
                // TODO: Extract rounds to config
                password: hashSync(createUserDto.password, 12),
            },
        })
    }

    async findSome(offset: number, count: number, queryString?: string) {
        const where: Prisma.UserWhereInput = queryString
            ? {
                  OR: [
                      { username: { contains: queryString } },
                      { firstName: { contains: queryString } },
                      { lastName: { contains: queryString } },
                  ],
              }
            : {}

        const [data, total] = await Promise.all([
            this.prismaService.user.findMany({
                skip: offset,
                take: count,
                where,
            }),
            this.prismaService.user.count({ where }),
        ])
        return { data, total }
    }

    findOne(id: number) {
        return this.prismaService.user.findFirst({
            where: { id },
        })
    }

    findByUsername(username: string) {
        return this.prismaService.user.findFirst({
            where: { username },
        })
    }

    update(id: number, updateUserDto: UpdateUserDto) {
        return this.prismaService.user.update({
            where: { id },
            data: {
                ...updateUserDto,
                // TODO: Extract rounds to config
                password: hashSync(updateUserDto.password, 12),
            },
        })
    }

    remove(id: number) {
        return this.prismaService.user.delete({
            where: { id },
        })
    }
}
