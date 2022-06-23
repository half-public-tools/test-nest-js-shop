import { Injectable } from '@nestjs/common'
import { PassportSerializer } from '@nestjs/passport'
import { User } from '@prisma/client'
import { UsersService } from 'src/users/users.service'

@Injectable()
export class AuthSerializer extends PassportSerializer {
    constructor(private readonly usersService: UsersService) {
        super()
    }

    serializeUser(user: User, done: (err, user: { id: User['id'] }) => void) {
        done(null, { id: user.id })
    }

    async deserializeUser(
        payload: { id: User['id'] },
        done: (err, user: User) => void,
    ) {
        try {
            const user = await this.usersService.findOne(payload.id)
            done(null, user)
        } catch (err) {
            done(err, null)
        }
    }
}
