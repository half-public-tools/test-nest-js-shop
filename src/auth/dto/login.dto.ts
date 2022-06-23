import { IsNotEmpty, IsString, Matches } from 'class-validator'

export class LoginDTO {
    @Matches(/^[A-Z0-9]{3,}$/i)
    username: string

    @IsString()
    @IsNotEmpty()
    password: string
}
