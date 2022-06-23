import { Prisma } from '@prisma/client'
import { Matches } from 'class-validator'

export class CreateUserDto implements Prisma.UserCreateInput {
    @Matches(/^[A-Z0-9]{3,}$/i)
    username: string

    @Matches(/^[!-~]{8,}$/)
    password: string

    @Matches(/^[А-Я0-9]{2,}$/iu)
    firstName: string

    @Matches(/^[А-Я0-9]{2,}$/iu)
    lastName: string
}
