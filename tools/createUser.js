/* eslint-disable @typescript-eslint/no-var-requires */

const { PrismaClient } = require('.prisma/client')
const { hashSync } = require('bcrypt')
const prompt = require('prompt')

const prismaClient = new PrismaClient()
prompt.start()

const main = async () => {
    const { firstName, lastName, username, password } = await prompt.get([
        'firstName',
        'lastName',
        'username',
        'password',
    ])
    const user = await prismaClient.user.create({
        data: {
            firstName,
            lastName,
            username,
            password: hashSync(password, 12),
        },
    })
    console.log('User created.', user)
}

main()
