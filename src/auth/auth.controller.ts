import { Controller, Post, Request, UseGuards } from '@nestjs/common'
import { AuthService } from './auth.service'
import { LocalGuard } from './local.guard'
import { LocalStrategy } from './local.strategy'

@Controller('auth')
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly localStrategy: LocalStrategy,
    ) {}

    @Post('login')
    @UseGuards(LocalGuard)
    async login() {
        return
    }

    @Post('logout')
    async logout(@Request() req) {
        req.logout()
        return true
    }
}
