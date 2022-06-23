import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { UsersModule } from './users/users.module'
import { AuthModule } from './auth/auth.module'
import * as expressSession from 'express-session'
import { PrismaSessionStore } from '@quixo3/prisma-session-store'
import { PrismaService } from './Common/prisma.service'
import { CategoriesModule } from './categories/categories.module'
import { OrdersModule } from './orders/orders.module'
import { ProductsModule } from './products/products.module'
import * as passport from 'passport'

@Module({
    imports: [
        UsersModule,
        AuthModule,
        CategoriesModule,
        OrdersModule,
        ProductsModule,
    ],
    controllers: [],
    providers: [PrismaService],
})
export class AppModule implements NestModule {
    constructor(private readonly prismaService: PrismaService) {}

    configure(consumer: MiddlewareConsumer) {
        consumer
            .apply(
                expressSession({
                    // TODO: Load from config
                    secret: '// TODO: Generate something secret',
                    saveUninitialized: false,
                    resave: false,
                    store: new PrismaSessionStore(this.prismaService, {
                        checkPeriod: 30 * 60 * 1000, // 30 min in ms
                        dbRecordIdIsSessionId: true,
                        dbRecordIdFunction: undefined,
                    }),
                    cookie: {
                        sameSite: true,
                        maxAge: 30 * 60 * 1000, // 30 min in ms
                    },
                }),
                passport.initialize(),
                passport.session(),
            )
            .forRoutes('*')
    }
}
