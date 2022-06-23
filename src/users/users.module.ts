import { Module } from '@nestjs/common'
import { UsersService } from './users.service'
import { UsersController } from './users.controller'
import { PrismaService } from 'src/Common/prisma.service'

@Module({
    controllers: [UsersController],
    providers: [PrismaService, UsersService],
    exports: [UsersService],
})
export class UsersModule {}
