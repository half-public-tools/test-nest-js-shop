import { Injectable } from '@nestjs/common'
import { UsersService } from 'src/users/users.service'
import { compareSync } from 'bcrypt'
import { User } from '@prisma/client'

@Injectable()
export class AuthService {
    constructor(private usersService: UsersService) {}

    async validateUser(
        username: string,
        password: string,
    ): Promise<Omit<User, 'password'> | null> {
        const user = await this.usersService.findByUsername(username)
        if (user && compareSync(password, user.password)) {
            delete user.password
            return user
        }
        return null
    }
}
